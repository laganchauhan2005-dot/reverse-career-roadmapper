"""
End-to-end API test — runs against the live backend at localhost:8000.
Tests: health, resources, explain (real Groq), roadmap generate (real Groq + Pydantic),
       roadmap adapt (real Groq).
Does NOT print the API key.
"""
import httpx
import time
import sys

BASE = "http://localhost:8000"
results = []


def check(name, passed, note=""):
    sym = "PASS" if passed else "FAIL"
    msg = f"[{sym}] {name}"
    if note:
        msg += f" — {note}"
    print(msg)
    results.append((name, passed, note))
    return passed


# ──────────────────────────────────────────
# 1. Health
# ──────────────────────────────────────────
print("\n── Health ──────────────────────────────")
try:
    r = httpx.get(f"{BASE}/health", timeout=5)
    data = r.json()
    check("Health endpoint", r.status_code == 200 and data.get("status") == "ok",
          f"status={data.get('status')}, version={data.get('version')}")
except Exception as e:
    check("Health endpoint", False, str(e))
    print("FATAL: backend not reachable. Aborting.")
    sys.exit(1)

# ──────────────────────────────────────────
# 2. Resources (no Groq key needed)
# ──────────────────────────────────────────
print("\n── Resources ───────────────────────────")
try:
    r = httpx.post(f"{BASE}/api/resources/recommend", json={
        "occupation": "Data Analyst",
        "skills": ["excel", "statistics", "python"],
        "budget": "free",
        "current_level": "some_experience"
    }, timeout=10)
    resources = r.json().get("resources", [])
    check("Resources endpoint (status)", r.status_code == 200)
    check("Resources: returns items", len(resources) > 0, f"{len(resources)} resources")
    check("Resources: all have real URLs", all(
        item["url"].startswith("https://") for item in resources
    ))
    if resources:
        print(f"  Sample: [{resources[0]['type']}] {resources[0]['title']} — {resources[0]['cost']}")
except Exception as e:
    check("Resources endpoint", False, str(e))

# ──────────────────────────────────────────
# 3. Explain — small real Groq request
# ──────────────────────────────────────────
print("\n── Assistant / Explain (live Groq) ─────")
try:
    print("  Sending request...")
    r = httpx.post(f"{BASE}/api/assistant/explain", json={
        "occupation": "Nurse",
        "question": "In one sentence, what does a nurse do?"
    }, timeout=30)
    if r.status_code == 200:
        text = r.json()["explanation"]
        check("Explain endpoint", True, f"{len(text)} chars returned")
        check("Explain: non-empty text", len(text.strip()) > 10)
        print(f"  Preview: {text[:180].strip()}")
    else:
        detail = r.json().get("detail", r.text[:200])
        check("Explain endpoint", False, f"HTTP {r.status_code}: {detail}")
except Exception as e:
    check("Explain endpoint", False, str(e))

# ──────────────────────────────────────────
# 4. Roadmap generate — full Groq + Pydantic
# ──────────────────────────────────────────
print("\n── Roadmap Generate (live Groq) ────────")
print("  Sending request (may take 15–30s)...")
roadmap = None
t0 = time.time()
try:
    r = httpx.post(f"{BASE}/api/roadmap/generate", json={
        "onboarding": {
            "occupation": "Data Analyst",
            "current_level": "complete_beginner",
            "known_skills": ["Excel basics"],
            "hours_per_week": 10,
            "target_months": 6,
            "learning_preferences": ["Video tutorials"],
            "budget": "free"
        }
    }, timeout=90)
    elapsed = round(time.time() - t0, 1)

    if r.status_code == 200:
        roadmap = r.json()["roadmap"]
        node_ids = [n["id"] for n in roadmap["nodes"]]
        unique_ids = set(node_ids)
        bad_prereqs = [
            p
            for n in roadmap["nodes"]
            for p in n["prerequisites"]
            if p not in unique_ids
        ]
        has_neg_hours = [n for n in roadmap["nodes"] if n["estimated_hours"] < 0]

        check("Roadmap generate (status 200)", True, f"{elapsed}s")
        check("Roadmap: has nodes", len(roadmap["nodes"]) > 0,
              f"{len(roadmap['nodes'])} nodes, {len(roadmap['edges'])} edges")
        check("Roadmap: unique node IDs", len(node_ids) == len(unique_ids),
              f"{len(unique_ids)}/{len(node_ids)} unique")
        check("Roadmap: valid prereq refs", len(bad_prereqs) == 0,
              f"{len(bad_prereqs)} broken refs" if bad_prereqs else "all valid")
        check("Roadmap: non-negative hours", len(has_neg_hours) == 0,
              "all ok" if not has_neg_hours else f"{len(has_neg_hours)} negative")
        check("Roadmap: has occupation", bool(roadmap["occupation"]),
              roadmap["occupation"])
        check("Roadmap: has summary", len(roadmap.get("summary", "")) > 10)

        print(f"\n  Occupation: {roadmap['occupation']}")
        print(f"  Summary: {roadmap['summary'][:120]}...")
        print("  First 3 nodes:")
        for n in roadmap["nodes"][:3]:
            prereqs = ", ".join(n["prerequisites"]) or "none"
            print(f"    [{n['id']}] {n['label']} | {n['category']} | {n['estimated_hours']}h | prereqs: {prereqs}")
    else:
        detail = ""
        try:
            detail = r.json().get("detail", r.text[:300])
        except Exception:
            detail = r.text[:300]
        check("Roadmap generate", False, f"HTTP {r.status_code}: {detail}")
except httpx.TimeoutException:
    check("Roadmap generate", False, "Request timed out after 90s")
except Exception as e:
    check("Roadmap generate", False, str(e))

# ──────────────────────────────────────────
# 5. Roadmap adapt — real Groq
# ──────────────────────────────────────────
print("\n── Roadmap Adapt (live Groq) ────────────")
if roadmap and len(roadmap["nodes"]) >= 2:
    completed = [roadmap["nodes"][0]["id"], roadmap["nodes"][1]["id"]]
    print(f"  Marking completed: {completed}")
    print("  Sending adapt request (may take 15–30s)...")
    try:
        r2 = httpx.post(f"{BASE}/api/roadmap/adapt", json={
            "roadmap": roadmap,
            "completed_skill_ids": completed
        }, timeout=90)
        if r2.status_code == 200:
            rm2 = r2.json()["roadmap"]
            changes = r2.json()["changes_summary"]
            check("Roadmap adapt (status 200)", True, f"{len(rm2['nodes'])} nodes after adapt")
            check("Roadmap adapt: changes summary", len(changes) > 5, changes[:120])
        else:
            detail = r2.json().get("detail", r2.text[:200])
            check("Roadmap adapt", False, f"HTTP {r2.status_code}: {detail}")
    except Exception as e:
        check("Roadmap adapt", False, str(e))
else:
    print("  SKIP — no roadmap generated or too few nodes")

# ──────────────────────────────────────────
# Summary
# ──────────────────────────────────────────
print("\n" + "=" * 50)
passed_n = sum(1 for _, p, _ in results if p)
total_n = len(results)
print(f"RESULTS: {passed_n}/{total_n} checks passed")
failed = [(n, note) for n, p, note in results if not p]
if failed:
    print("\nFAILED:")
    for n, note in failed:
        print(f"  ✗ {n}: {note}")
else:
    print("All checks passed!")
print()
sys.exit(0 if not failed else 1)
