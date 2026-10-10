from __future__ import annotations
import json
import uuid
from app.core.groq_client import chat_json, chat_text
from app.schemas.models import (
    Roadmap, SkillNode, RoadmapEdge,
    GenerateRoadmapRequest, AdaptRoadmapRequest,
    ExplainRequest, ResourceRequest, ResourceItem,
)

# ---------------------------------------------------------------------------
# Roadmap generation
# ---------------------------------------------------------------------------

ROADMAP_SYSTEM = """You are a world-class career coach and curriculum designer.
Your job is to produce a structured, realistic, and personalized career learning roadmap.
Always respond with ONLY valid JSON matching the schema below — no prose, no markdown fences.

Schema:
{
  "id": "<uuid>",
  "occupation": "<string>",
  "summary": "<2-3 sentence overview>",
  "total_estimated_hours": <number>,
  "nodes": [
    {
      "id": "<unique-slug>",
      "label": "<short name>",
      "category": "<foundation|technical|soft_skill|tool|domain|project|milestone>",
      "description": "<1-2 sentences what this skill/milestone is and why it matters>",
      "estimated_hours": <number>,
      "prerequisites": ["<other-node-id>", ...],
      "resources": ["<short resource hint>"],
      "level": <1-N depth>
    }
  ],
  "edges": [
    {"source": "<node-id>", "target": "<node-id>"}
  ]
}

Rules:
- Every edge must correspond to a prerequisite relationship between real nodes.
- Prerequisite IDs must exist as node IDs.
- IDs must be unique kebab-case slugs.
- No circular dependencies.
- estimated_hours must be >= 0.
- total_estimated_hours must equal the sum of all node estimated_hours.
- Include 8-20 nodes for a realistic but learnable roadmap.
- Tailor the roadmap specifically to the learner's level, known skills, and timeline.
- Category 'project' nodes are hands-on projects; 'milestone' nodes mark major achievements."""


def _build_roadmap_prompt(req: GenerateRoadmapRequest) -> str:
    o = req.onboarding
    known = ", ".join(o.known_skills) if o.known_skills else "none listed"
    prefs = ", ".join(o.learning_preferences) if o.learning_preferences else "no preference"
    return f"""Create a personalized career roadmap for:
Occupation: {o.occupation}
Current level: {o.current_level}
Known skills: {known}
Available time: {o.hours_per_week} hours/week
Target timeline: {o.target_months} months
Learning preferences: {prefs}
Budget: {o.budget}

Generate a realistic roadmap tailored to this person. Skip skills they already know.
Return ONLY valid JSON."""


def generate_roadmap(req: GenerateRoadmapRequest) -> Roadmap:
    raw = chat_json(
        system_prompt=ROADMAP_SYSTEM,
        user_prompt=_build_roadmap_prompt(req),
        temperature=0.35,
        max_tokens=4096,
    )
    # Inject a stable id if missing
    if not raw.get("id"):
        raw["id"] = str(uuid.uuid4())
    # Validate with Pydantic
    roadmap = Roadmap.model_validate(raw)
    # Rebuild edges from prerequisites to ensure consistency
    rebuilt_edges: list[dict] = []
    node_ids = {n.id for n in roadmap.nodes}
    for node in roadmap.nodes:
        for prereq in node.prerequisites:
            if prereq in node_ids:
                rebuilt_edges.append({"source": prereq, "target": node.id})
    roadmap.edges = [RoadmapEdge(**e) for e in rebuilt_edges]
    return roadmap


# ---------------------------------------------------------------------------
# Roadmap adaptation
# ---------------------------------------------------------------------------

ADAPT_SYSTEM = """You are a career coach updating an existing roadmap.
The user has completed or already knows certain skills.
Produce an updated roadmap JSON (same schema) that:
- Marks completed skills as status='completed'
- Potentially removes or replaces skills made redundant by completed prerequisites
- Adjusts remaining estimated_hours accordingly
- Adds a 'changes_summary' field at the top level explaining what changed

Respond with ONLY valid JSON:
{
  "changes_summary": "<what changed and why>",
  "roadmap": { ...same Roadmap schema... }
}"""


def adapt_roadmap(req: AdaptRoadmapRequest) -> tuple[Roadmap, str]:
    roadmap_json = req.roadmap.model_dump_json(indent=2)
    completed = json.dumps(req.completed_skill_ids)
    prompt = f"""Existing roadmap:
{roadmap_json}

Skills the learner has now completed or already knows:
{completed}

Update the roadmap accordingly. Return ONLY valid JSON with 'changes_summary' and 'roadmap' keys."""

    raw = chat_json(
        system_prompt=ADAPT_SYSTEM,
        user_prompt=prompt,
        temperature=0.25,
        max_tokens=4096,
    )
    changes = raw.get("changes_summary", "Roadmap updated based on completed skills.")
    roadmap_data = raw.get("roadmap", raw)
    if not roadmap_data.get("id"):
        roadmap_data["id"] = req.roadmap.id
    roadmap = Roadmap.model_validate(roadmap_data)
    return roadmap, changes


# ---------------------------------------------------------------------------
# Career explanation
# ---------------------------------------------------------------------------

EXPLAIN_SYSTEM = """You are a friendly, encouraging career counselor explaining careers to beginners.
Use clear, jargon-free language. Be honest about challenges and exciting about opportunities.
Keep your response to 300-500 words unless a specific question requires more detail.
Format with markdown: use headings (##), bullet points, and bold for key terms."""


def explain_career(req: ExplainRequest) -> str:
    if req.question:
        prompt = f"Career: {req.occupation}\n\nFollow-up question: {req.question}"
        if req.context:
            prompt += f"\n\nContext (current topic): {req.context}"
    else:
        prompt = f"""Please explain the career of a {req.occupation} to a complete beginner.
Cover:
- What does a {req.occupation} actually do day-to-day?
- What skills do they use?
- Why is this career valuable?
- What does a typical workday look like?
- What challenges will they face?
- What are the exciting opportunities?"""
    return chat_text(
        system_prompt=EXPLAIN_SYSTEM,
        user_prompt=prompt,
        temperature=0.5,
        max_tokens=1500,
    )


# ---------------------------------------------------------------------------
# Resource recommendations (curated catalogue + domain-aware filtering)
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Curated catalogue — real, verified URLs.  Prices as of late 2024.
# Each entry has a "domains" list that maps it to broad career categories.
# ---------------------------------------------------------------------------
CURATED_RESOURCES: list[dict] = [

    # ── Programming / Computer Science ──────────────────────────────────────
    {"title": "CS50: Introduction to Computer Science",
     "provider": "Harvard / edX", "url": "https://cs50.harvard.edu/x/",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["programming", "computer science", "python", "software development"],
     "description": "World-renowned intro CS course covering C, Python, SQL and web basics.",
     "domains": ["tech", "software", "data"]},

    {"title": "freeCodeCamp",
     "provider": "freeCodeCamp", "url": "https://www.freecodecamp.org/",
     "type": "course", "cost": "Free",
     "skill_tags": ["web development", "javascript", "html", "css", "python", "data analysis"],
     "description": "Thousands of free interactive coding lessons and projects with certifications.",
     "domains": ["tech", "software", "web"]},

    {"title": "The Odin Project",
     "provider": "The Odin Project", "url": "https://www.theodinproject.com/",
     "type": "course", "cost": "Free",
     "skill_tags": ["web development", "javascript", "ruby", "html", "css"],
     "description": "Open source full stack web dev curriculum taught through real projects.",
     "domains": ["tech", "software", "web"]},

    {"title": "Khan Academy – Computing",
     "provider": "Khan Academy", "url": "https://www.khanacademy.org/computing",
     "type": "course", "cost": "Free",
     "skill_tags": ["programming", "computer science", "javascript"],
     "description": "Beginner-friendly computing and programming courses.",
     "domains": ["tech", "software"]},

    {"title": "Traversy Media",
     "provider": "YouTube", "url": "https://www.youtube.com/@TraversyMedia",
     "type": "video", "cost": "Free",
     "skill_tags": ["web development", "javascript", "react", "node.js", "programming"],
     "description": "High-quality web development tutorials for all skill levels.",
     "domains": ["tech", "software", "web"]},

    {"title": "Fireship",
     "provider": "YouTube", "url": "https://www.youtube.com/@Fireship",
     "type": "video", "cost": "Free",
     "skill_tags": ["web development", "javascript", "typescript", "react"],
     "description": "Fast-paced, fun explanations of modern web development concepts.",
     "domains": ["tech", "software", "web"]},

    {"title": "Stack Overflow",
     "provider": "Stack Overflow", "url": "https://stackoverflow.com/",
     "type": "community", "cost": "Free",
     "skill_tags": ["programming", "debugging", "software development"],
     "description": "The largest Q&A community for developers.",
     "domains": ["tech", "software"]},

    {"title": "Reddit – r/learnprogramming",
     "provider": "Reddit", "url": "https://www.reddit.com/r/learnprogramming/",
     "type": "community", "cost": "Free",
     "skill_tags": ["programming", "learning", "career", "software development"],
     "description": "Supportive community for beginner programmers.",
     "domains": ["tech", "software"]},

    # ── Data / Machine Learning ──────────────────────────────────────────────
    {"title": "Kaggle Learn",
     "provider": "Kaggle", "url": "https://www.kaggle.com/learn",
     "type": "course", "cost": "Free",
     "skill_tags": ["data science", "machine learning", "python", "sql", "data analysis"],
     "description": "Bite-sized, practical data science and ML micro-courses with free compute.",
     "domains": ["data", "tech", "ai"]},

    {"title": "fast.ai – Practical Deep Learning",
     "provider": "fast.ai", "url": "https://course.fast.ai/",
     "type": "course", "cost": "Free",
     "skill_tags": ["deep learning", "machine learning", "python", "ai"],
     "description": "Top-down, practical deep learning course used by researchers worldwide.",
     "domains": ["data", "ai", "tech"]},

    {"title": "Google Data Analytics Certificate",
     "provider": "Coursera / Google", "url": "https://grow.google/certificates/data-analytics/",
     "type": "course", "cost": "~$49/mo (financial aid available)",
     "skill_tags": ["data analysis", "sql", "spreadsheets", "data visualization", "r"],
     "description": "Entry-level professional certificate covering the full data analytics workflow.",
     "domains": ["data", "business"]},

    {"title": "3Blue1Brown – Math & ML",
     "provider": "YouTube", "url": "https://www.youtube.com/@3blue1brown",
     "type": "video", "cost": "Free",
     "skill_tags": ["mathematics", "linear algebra", "calculus", "machine learning"],
     "description": "Beautiful visual explanations of complex math and ML concepts.",
     "domains": ["data", "ai", "math", "tech"]},

    {"title": "Andrej Karpathy – Neural Networks Zero to Hero",
     "provider": "YouTube",
     "url": "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
     "type": "video", "cost": "Free",
     "skill_tags": ["deep learning", "machine learning", "ai", "python", "neural networks"],
     "description": "Hands-on series building neural networks from scratch by a legendary AI researcher.",
     "domains": ["ai", "data", "tech"]},

    # ── UX / Design ─────────────────────────────────────────────────────────
    {"title": "Google UX Design Certificate",
     "provider": "Coursera / Google", "url": "https://grow.google/certificates/ux-design/",
     "type": "course", "cost": "~$49/mo (financial aid available)",
     "skill_tags": ["ux design", "ui design", "figma", "user research", "prototyping"],
     "description": "Beginner-friendly 7-course series covering the full UX design process.",
     "domains": ["design", "ux"]},

    {"title": "Figma – Learn Design",
     "provider": "Figma", "url": "https://www.figma.com/resources/learn-design/",
     "type": "article", "cost": "Free",
     "skill_tags": ["figma", "ui design", "ux design", "graphic design"],
     "description": "Official Figma tutorials and design fundamentals from the tool itself.",
     "domains": ["design", "ux", "graphic"]},

    {"title": "Canva Design School",
     "provider": "Canva", "url": "https://www.canva.com/learn/",
     "type": "article", "cost": "Free",
     "skill_tags": ["graphic design", "visual design", "branding", "typography"],
     "description": "Free design tutorials and articles covering visual communication fundamentals.",
     "domains": ["design", "graphic", "creative"]},

    # ── Business / Management / Marketing ───────────────────────────────────
    {"title": "Google Project Management Certificate",
     "provider": "Coursera / Google", "url": "https://grow.google/certificates/project-management/",
     "type": "course", "cost": "~$49/mo (financial aid available)",
     "skill_tags": ["project management", "agile", "scrum", "leadership"],
     "description": "Professional certificate covering project management fundamentals and Agile.",
     "domains": ["business", "management"]},

    {"title": "Harvard Business School Online – Business Analytics",
     "provider": "HBS Online", "url": "https://online.hbs.edu/courses/business-analytics/",
     "type": "course", "cost": "~$1,750 (one-time)",
     "skill_tags": ["business analytics", "data analysis", "business", "decision making"],
     "description": "8-week rigorous program on using data to drive business decisions.",
     "domains": ["business", "data"]},

    {"title": "Google Digital Marketing & E-Commerce Certificate",
     "provider": "Coursera / Google",
     "url": "https://grow.google/certificates/digital-marketing-ecommerce/",
     "type": "course", "cost": "~$49/mo (financial aid available)",
     "skill_tags": ["digital marketing", "seo", "marketing", "e-commerce", "analytics"],
     "description": "Professional certificate covering digital marketing and e-commerce fundamentals.",
     "domains": ["marketing", "business"]},

    {"title": "HubSpot Academy",
     "provider": "HubSpot", "url": "https://academy.hubspot.com/",
     "type": "course", "cost": "Free",
     "skill_tags": ["marketing", "inbound marketing", "crm", "sales", "content marketing"],
     "description": "Free professional certifications in marketing, sales, and customer service.",
     "domains": ["marketing", "business", "sales"]},

    {"title": "Coursera – Business Foundations (Wharton)",
     "provider": "Coursera / Wharton",
     "url": "https://www.coursera.org/specializations/wharton-business-foundations",
     "type": "course", "cost": "~$49/mo (audit free)",
     "skill_tags": ["accounting", "finance", "marketing", "business", "operations"],
     "description": "Five-course Wharton specialisation covering core business disciplines.",
     "domains": ["business", "finance", "management"]},

    # ── Finance / Accounting ─────────────────────────────────────────────────
    {"title": "Khan Academy – Personal Finance",
     "provider": "Khan Academy", "url": "https://www.khanacademy.org/college-careers-more/personal-finance",
     "type": "course", "cost": "Free",
     "skill_tags": ["personal finance", "accounting", "taxes", "investing", "financial planning"],
     "description": "Free courses on budgeting, investing, taxes, and financial planning.",
     "domains": ["finance", "accounting"]},

    {"title": "CFA Institute – Free Learning Ecosystem",
     "provider": "CFA Institute",
     "url": "https://www.cfainstitute.org/en/membership/professional-development/refresher-readings",
     "type": "article", "cost": "Free (member) / Paid exam",
     "skill_tags": ["finance", "investment", "portfolio management", "financial analysis", "cfa"],
     "description": "Official CFA curriculum refresher readings covering core investment topics.",
     "domains": ["finance", "investment"]},

    {"title": "Investopedia Academy",
     "provider": "Investopedia", "url": "https://www.investopedia.com/investopedia-academy-4687875",
     "type": "course", "cost": "Varies (~$99–$199)",
     "skill_tags": ["finance", "investing", "trading", "financial analysis", "accounting"],
     "description": "Paid short courses on investing, trading, financial analysis, and Excel for finance.",
     "domains": ["finance", "investment", "accounting"]},

    # ── Medicine / Healthcare ────────────────────────────────────────────────
    {"title": "Khan Academy – Health & Medicine",
     "provider": "Khan Academy",
     "url": "https://www.khanacademy.org/science/health-and-medicine",
     "type": "course", "cost": "Free",
     "skill_tags": ["medicine", "biology", "anatomy", "physiology", "healthcare",
                    "nursing", "dermatology", "clinical medicine"],
     "description": "Free medical science content covering biology, anatomy, physiology, and clinical topics.",
     "domains": ["medicine", "healthcare", "nursing", "dermatology"]},

    {"title": "Osmosis – Medical Education Platform",
     "provider": "Osmosis / Elsevier",
     "url": "https://www.osmosis.org/",
     "type": "course", "cost": "Free basic / ~$35/mo premium",
     "skill_tags": ["medicine", "clinical medicine", "pathology", "pharmacology",
                    "anatomy", "dermatology", "healthcare"],
     "description": "Video-based medical education platform used by medical students worldwide, "
                    "covering pathophysiology, pharmacology, and clinical reasoning.",
     "domains": ["medicine", "healthcare", "dermatology", "nursing", "pharmacy"]},

    {"title": "DermNet – Dermatology Reference",
     "provider": "DermNet NZ",
     "url": "https://dermnetnz.org/",
     "type": "article", "cost": "Free",
     "skill_tags": ["dermatology", "skin conditions", "clinical medicine",
                    "medicine", "diagnosis", "pathology"],
     "description": "Comprehensive, peer-reviewed dermatology reference covering thousands of skin conditions, "
                    "treatments, and clinical images. Used by medical professionals worldwide.",
     "domains": ["dermatology", "medicine", "healthcare"]},

    {"title": "AAD – American Academy of Dermatology",
     "provider": "American Academy of Dermatology",
     "url": "https://www.aad.org/",
     "type": "article", "cost": "Free",
     "skill_tags": ["dermatology", "skin conditions", "clinical dermatology",
                    "medicine", "patient education", "practice guidelines"],
     "description": "Official resource of the American Academy of Dermatology — "
                    "clinical guidelines, patient education, and practice resources "
                    "for dermatologists and trainees.",
     "domains": ["dermatology", "medicine", "healthcare"]},

    {"title": "VisualDx – Dermatology & Clinical Decision Support",
     "provider": "VisualDx",
     "url": "https://www.visualdx.com/",
     "type": "course", "cost": "Institutional / subscription",
     "skill_tags": ["dermatology", "clinical decision making", "diagnosis",
                    "skin conditions", "medicine"],
     "description": "Clinical decision-support tool and learning system for dermatology and differential diagnosis.",
     "domains": ["dermatology", "medicine", "healthcare"]},

    {"title": "AMBOSS – Medical Knowledge Platform",
     "provider": "AMBOSS",
     "url": "https://www.amboss.com/",
     "type": "course", "cost": "Free trial / ~$17/mo",
     "skill_tags": ["medicine", "clinical medicine", "pharmacology", "anatomy",
                    "pathology", "surgery", "dermatology", "usmle"],
     "description": "Comprehensive medical learning platform for students and clinicians, "
                    "with clinical decision support and board-exam preparation.",
     "domains": ["medicine", "healthcare", "dermatology", "surgery", "nursing"]},

    {"title": "Coursera – Clinical Terminology for International & US Students",
     "provider": "Coursera / University of Pittsburgh",
     "url": "https://www.coursera.org/learn/clinical-terminology",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["medicine", "clinical terminology", "healthcare", "anatomy"],
     "description": "Free audit course covering clinical medical terminology for healthcare learners.",
     "domains": ["medicine", "healthcare", "nursing"]},

    {"title": "Medscape – Medical Education & CME",
     "provider": "Medscape / WebMD", "url": "https://www.medscape.com/",
     "type": "article", "cost": "Free",
     "skill_tags": ["medicine", "clinical medicine", "dermatology", "pharmacology",
                    "continuing medical education", "cme", "healthcare"],
     "description": "Free continuing medical education (CME) articles, clinical guidelines, "
                    "and drug reference for practising clinicians.",
     "domains": ["medicine", "healthcare", "dermatology", "pharmacy", "nursing"]},

    # ── Nursing / Allied Health ──────────────────────────────────────────────
    {"title": "RegisteredNurseRN – Nursing Education",
     "provider": "YouTube / RegisteredNurseRN",
     "url": "https://www.youtube.com/@RegisteredNurseRN",
     "type": "video", "cost": "Free",
     "skill_tags": ["nursing", "pharmacology", "anatomy", "clinical nursing",
                    "healthcare", "nclex", "patient care"],
     "description": "Popular YouTube channel with nursing education videos on pharmacology, "
                    "anatomy, and clinical skills for nursing students.",
     "domains": ["nursing", "healthcare", "medicine"]},

    {"title": "Nurse.com – Continuing Education",
     "provider": "Nurse.com",
     "url": "https://www.nurse.com/ce",
     "type": "course", "cost": "Free & paid CE credits",
     "skill_tags": ["nursing", "continuing education", "clinical nursing", "healthcare", "ceu"],
     "description": "Online continuing education courses for nurses, including free CE credit options.",
     "domains": ["nursing", "healthcare"]},

    # ── Law / Legal ─────────────────────────────────────────────────────────
    {"title": "Coursera – Introduction to American Law (Penn)",
     "provider": "Coursera / University of Pennsylvania",
     "url": "https://www.coursera.org/learn/american-law",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["law", "legal", "american law", "contracts", "constitutional law"],
     "description": "Free-to-audit overview of the American legal system from the University of Pennsylvania.",
     "domains": ["law", "legal"]},

    {"title": "Harvard Law School – Free Online Courses",
     "provider": "Harvard Law / edX",
     "url": "https://hls.harvard.edu/academics/curriculum/online-courses/",
     "type": "course", "cost": "Free (audit) / Certificate paid",
     "skill_tags": ["law", "legal", "jurisprudence", "contracts", "litigation"],
     "description": "Free-to-audit Harvard Law courses covering jurisprudence, contracts, and legal reasoning.",
     "domains": ["law", "legal"]},

    {"title": "Legal Information Institute (LII)",
     "provider": "Cornell Law School", "url": "https://www.law.cornell.edu/",
     "type": "article", "cost": "Free",
     "skill_tags": ["law", "legal", "case law", "statutes", "regulations", "legal research"],
     "description": "Free, comprehensive legal reference maintained by Cornell Law — "
                    "statutes, case law, and legal definitions.",
     "domains": ["law", "legal", "paralegal"]},

    # ── Education / Teaching ─────────────────────────────────────────────────
    {"title": "edX – Education & Teaching",
     "provider": "edX", "url": "https://www.edx.org/learn/teaching",
     "type": "course", "cost": "Free (audit) / Certificate paid",
     "skill_tags": ["teaching", "education", "pedagogy", "curriculum design", "instructional design"],
     "description": "Collection of teaching and education courses from world-class universities on edX.",
     "domains": ["education", "teaching"]},

    # ── Culinary Arts / Chef ─────────────────────────────────────────────────
    {"title": "MasterClass – Gordon Ramsay Teaches Cooking",
     "provider": "MasterClass", "url": "https://www.masterclass.com/classes/gordon-ramsay-teaches-cooking",
     "type": "course", "cost": "~$120/yr (all-access)",
     "skill_tags": ["cooking", "culinary arts", "chef", "kitchen skills", "food preparation"],
     "description": "Gordon Ramsay teaches restaurant-quality cooking techniques in a high-production video course.",
     "domains": ["culinary", "chef", "food"]},

    {"title": "America's Test Kitchen Online Cooking School",
     "provider": "America's Test Kitchen",
     "url": "https://www.americastestkitchen.com/cooking-school",
     "type": "course", "cost": "Free trial / ~$40/yr",
     "skill_tags": ["cooking", "culinary arts", "baking", "food science", "kitchen techniques"],
     "description": "Structured cooking school with technique-focused lessons backed by food science.",
     "domains": ["culinary", "chef", "food", "baking"]},

    {"title": "Rouxbe Online Culinary School",
     "provider": "Rouxbe", "url": "https://rouxbe.com/",
     "type": "course", "cost": "~$10–$20/mo",
     "skill_tags": ["culinary arts", "professional cooking", "chef", "knife skills",
                    "food safety", "plating"],
     "description": "Professional-grade online culinary school used by aspiring and working chefs worldwide.",
     "domains": ["culinary", "chef", "food", "professional cooking"]},

    {"title": "ServSafe – Food Safety Certification",
     "provider": "National Restaurant Association",
     "url": "https://www.servsafe.com/",
     "type": "course", "cost": "~$15–$30",
     "skill_tags": ["food safety", "food handler", "chef", "culinary arts", "health code"],
     "description": "Industry-standard food safety certification required for most professional kitchen roles.",
     "domains": ["culinary", "chef", "food", "food safety"]},

    # ── Creative Arts / Music / Photography ──────────────────────────────────
    {"title": "Coursera – Modern & Contemporary Art (MoMA)",
     "provider": "Coursera / MoMA",
     "url": "https://www.coursera.org/learn/modern-contemporary-art",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["art history", "modern art", "art", "visual arts", "curation"],
     "description": "MoMA's free-to-audit course on modern and contemporary art movements.",
     "domains": ["arts", "creative", "art history"]},

    {"title": "Coursera – Songwriting (Berklee)",
     "provider": "Coursera / Berklee", "url": "https://www.coursera.org/learn/songwriting",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["music", "songwriting", "music production", "composition", "lyrics"],
     "description": "Free-to-audit Berklee course on songwriting craft, melody, harmony, and lyrics.",
     "domains": ["music", "creative", "arts"]},

    {"title": "Coursera – Photography Basics (Michigan)",
     "provider": "Coursera / Michigan",
     "url": "https://www.coursera.org/learn/photography-basics",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["photography", "composition", "lighting", "camera", "visual arts"],
     "description": "Beginner-friendly course on camera settings, composition, and visual storytelling.",
     "domains": ["photography", "creative", "arts"]},

    # ── Trades / Engineering ─────────────────────────────────────────────────
    {"title": "MIT OpenCourseWare – Engineering",
     "provider": "MIT / OCW", "url": "https://ocw.mit.edu/",
     "type": "course", "cost": "Free",
     "skill_tags": ["engineering", "physics", "mathematics", "circuits", "mechanics",
                    "electrical engineering", "civil engineering"],
     "description": "Free MIT course materials — lecture notes, problem sets, and exams — "
                    "for hundreds of engineering courses.",
     "domains": ["engineering", "trades", "tech", "math"]},

    {"title": "Khan Academy – Science & Engineering",
     "provider": "Khan Academy",
     "url": "https://www.khanacademy.org/science",
     "type": "course", "cost": "Free",
     "skill_tags": ["physics", "chemistry", "biology", "mathematics", "engineering"],
     "description": "Free courses in physics, chemistry, biology, and mathematics — "
                    "foundational for engineering and science careers.",
     "domains": ["engineering", "science", "trades", "math", "medicine", "healthcare"]},

    # ── General / Universal ──────────────────────────────────────────────────
    {"title": "Coursera – Learning How to Learn",
     "provider": "Coursera / UC San Diego",
     "url": "https://www.coursera.org/learn/learning-how-to-learn",
     "type": "course", "cost": "Free (audit)",
     "skill_tags": ["learning", "study skills", "productivity", "memory", "career"],
     "description": "Science-backed techniques for learning faster and retaining more — "
                    "useful for any career learner.",
     "domains": ["general", "education", "career"]},

    {"title": "LinkedIn Learning",
     "provider": "LinkedIn", "url": "https://www.linkedin.com/learning/",
     "type": "course", "cost": "~$30/mo (free with many library cards)",
     "skill_tags": ["career", "professional development", "leadership", "communication",
                    "business", "software", "design"],
     "description": "Thousands of professional courses across every career domain — "
                    "often free through public libraries.",
     "domains": ["general", "business", "tech", "design", "career", "management"]},
]

# ---------------------------------------------------------------------------
# Domain keyword → domain label mapping.
# The occupation string is matched case-insensitively against these keywords.
# The FIRST matching domain label wins.
# ---------------------------------------------------------------------------
_DOMAIN_KEYWORDS: list[tuple[str, list[str]]] = [
    # medicine / healthcare first so "dermatologist" doesn't fall to general
    ("dermatology",  ["dermatologist", "dermatology", "dermatologic"]),
    ("medicine",     ["doctor", "physician", "surgeon", "surgery", "medical",
                      "medicine", "psychiatrist", "psychiatry", "radiologist",
                      "cardiologist", "neurologist", "oncologist", "urologist",
                      "pediatrician", "paediatrician", "orthopedic", "anesthesiologist",
                      "pathologist", "ophthalmologist", "otolaryngologist",
                      "gastroenterologist", "endocrinologist", "rheumatologist",
                      "infectiou", "geriatri", "internist", "hospitalist", "gp",
                      "general practitioner", "obstetrician", "gynecologist"]),
    ("nursing",      ["nurse", "nursing", "rn", "lpn", "cna", "midwife",
                      "paramedic", "emt", "allied health", "occupational therapist",
                      "physical therapist", "respiratory therapist", "radiographer",
                      "sonographer", "phlebotomist", "dental hygienist", "optometrist"]),
    ("pharmacy",     ["pharmacist", "pharmacy", "pharmaceutical"]),
    ("healthcare",   ["health", "healthcare", "clinical", "dietitian", "nutritionist",
                      "counselor", "therapist", "psychologist", "social worker"]),
    ("law",          ["lawyer", "attorney", "solicitor", "barrister", "paralegal",
                      "judge", "legal", "law school", "litigator", "counsel"]),
    ("finance",      ["accountant", "accounting", "actuary", "auditor", "bookkeeper",
                      "financial analyst", "investment banker", "banker", "financial planner",
                      "cfo", "economist", "forex", "trader", "wealth manager"]),
    ("culinary",     ["chef", "cook", "baker", "culinary", "pastry", "barista",
                      "sommelier", "food", "restauran", "catering"]),
    ("engineering",  ["engineer", "engineering", "electrician", "plumber", "carpenter",
                      "welder", "mechanic", "civil", "structural", "aerospace",
                      "chemical engineer", "biomedical", "environmental engineer",
                      "manufacturing", "industrial engineer"]),
    ("architecture", ["architect", "architecture", "urban planner", "urban design",
                      "interior designer"]),
    ("design",       ["designer", "ux", "ui", "graphic design", "graphic designer",
                      "product designer", "motion designer", "art director", "illustrator",
                      "animator"]),
    ("creative",     ["artist", "musician", "photographer", "videographer", "filmmaker",
                      "writer", "journalist", "copywriter", "screenwriter", "actor",
                      "dancer", "choreograph"]),
    ("education",    ["teacher", "educator", "tutor", "professor", "instructor",
                      "lecturer", "academic", "school", "curriculum"]),
    ("marketing",    ["marketer", "marketing", "seo", "social media", "brand",
                      "public relation", "pr", "advertis", "copywriter", "content"]),
    ("business",     ["manager", "management", "business", "entrepreneur", "startup",
                      "operations", "consultant", "strategy", "executive", "ceo", "coo"]),
    ("sales",        ["sales", "account executive", "business development", "salesperson"]),
    ("data",         ["data scientist", "data analyst", "data engineer", "bi analyst",
                      "business intelligence", "analyst", "statistician", "quant"]),
    ("ai",           ["ai", "machine learning", "deep learning", "nlp", "computer vision",
                      "ml engineer", "ai researcher"]),
    ("software",     ["software", "developer", "programmer", "engineer", "devops",
                      "sre", "full stack", "frontend", "backend", "mobile developer",
                      "ios", "android", "cloud", "sysadmin", "security"]),
    ("web",          ["web developer", "web designer", "webmaster"]),
]


def _occupation_to_domains(occupation: str) -> list[str]:
    """Return a list of domain labels that match the given occupation string."""
    occ_lower = occupation.lower()
    matched: list[str] = []
    for domain, keywords in _DOMAIN_KEYWORDS:
        if any(kw in occ_lower for kw in keywords):
            matched.append(domain)
    return matched


def recommend_resources(req: ResourceRequest) -> list[ResourceItem]:
    """
    Filter the curated catalogue by relevance to the user's occupation.

    Scoring:
      +20  resource domain matches the occupation's primary domain
      + 2  per skill_tag that intersects with requested skills
      -10  resource costs money but user wants free-only
    """
    occupation_domains = set(_occupation_to_domains(req.occupation))

    # Skill tags from the request (lowercase)
    req_skill_tags = {t.lower() for t in req.skills}
    req_skill_tags.add(req.occupation.lower())

    scored: list[tuple[int, dict]] = []
    for res in CURATED_RESOURCES:
        score = 0

        # Domain match — primary signal
        res_domains = set(res.get("domains", []))
        if occupation_domains & res_domains:
            score += 20

        # Skill-tag intersection — secondary signal
        res_tags = {t.lower() for t in res["skill_tags"]}
        score += 2 * len(req_skill_tags & res_tags)

        # Budget penalty
        cost = res["cost"]
        if req.budget == "free" and "free" not in cost.lower():
            score -= 10

        if score > 0:
            scored.append((score, res))

    # Deduplicate by URL (same resource may appear twice in catalogue)
    seen_urls: set[str] = set()
    unique_scored: list[tuple[int, dict]] = []
    for s, r in scored:
        if r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            unique_scored.append((s, r))

    unique_scored.sort(key=lambda x: x[0], reverse=True)
    top = [r for _, r in unique_scored[:10]]

    # If still empty, return a single "no relevant resources" sentinel so the
    # frontend can display a clear message rather than unrelated content.
    if not top:
        return []

    # Strip internal "domains" key before returning (not in ResourceItem schema)
    clean = [{k: v for k, v in r.items() if k != "domains"} for r in top]
    return [ResourceItem(**r) for r in clean]

