# Reverse Career Roadmapper

> **AI-powered career preparation for beginners targeting any occupation.**  
> Built for the Code2Career Hackathon — October 2026.

---

## What it does

Reverse Career Roadmapper takes someone who says "I want to become a **[nurse / data scientist / UX designer / chef / anything]**" and builds them a personalised, interactive learning roadmap — starting from *where they are now*.

| Feature | Status |
|---|---|
| Career onboarding (occupation, level, hours, budget) | ✅ Done |
| AI-generated personalized roadmap (Groq / GPT-OSS-20B) | ✅ Done |
| Interactive skill graph (zoom, pan, click, prerequisites) | ✅ Done |
| Marking skills: Not Started / In Progress / Completed | ✅ Done |
| Adaptive roadmap (AI re-optimises after completions) | ✅ Done |
| Career Progress tab with completion % | ✅ Done |
| Learning Resources tab (curated real links) | ✅ Done |
| Career Assistant chat (ask anything about the career) | ✅ Done |
| Persistence — roadmap survives browser refresh | ✅ Done |
| Dark responsive UI | ✅ Done |
| Backend health endpoint | ✅ Done |
| Vercel-ready frontend | ✅ Done |
| Render-ready backend | ✅ Done |

---

## Architecture

```
reverse-career-roadmapper/
├── frontend/          # React + Vite + TypeScript + Tailwind CSS v4 + @xyflow/react
│   ├── src/
│   │   ├── components/   OnboardingForm, RoadmapGraph, CustomSkillNode,
│   │   │                 NodeDetailPanel, ProgressTab, ResourcesTab, AssistantTab
│   │   ├── pages/        WorkspacePage
│   │   ├── hooks/        usePersistentState (localStorage)
│   │   ├── services/     api.ts (all fetch calls)
│   │   └── types/        shared TypeScript types
│   ├── vercel.json
│   └── .env.example
└── backend/           # Python 3.13 + FastAPI + Pydantic v2 + Groq SDK
    ├── app/
    │   ├── api/          roadmap.py, assistant.py, resources.py
    │   ├── core/         config.py (pydantic-settings), groq_client.py
    │   ├── schemas/      models.py (all request/response types)
    │   └── services/     roadmap_service.py (AI logic + curated catalogue)
    ├── requirements.txt
    ├── Procfile
    └── .env.example
```

**Why this stack?**  
- FastAPI keeps the Groq API key *server-side only* — it never touches the browser.  
- React Flow (`@xyflow/react`) gives a production-quality graph with zero custom canvas code.  
- Tailwind v4 via Vite plugin requires no config file.  
- `localStorage` persistence requires no database for the MVP scope.

---

## What AI we used

| AI | Role |
|---|---|
| **Groq — `openai/gpt-oss-20b`** | Roadmap generation, milestone explanation, career Q&A, roadmap adaptation |
| **Antigravity (Google DeepMind)** | Coding assistant that built this project |

---

## Intended users

Absolute beginners who know *what* they want to become but not *how* to get there. Works for any profession, not just software roles.

---

## How to run locally

### Prerequisites
- Node.js ≥ 18, npm ≥ 10
- Python ≥ 3.11
- A Groq API key (free tier works): https://console.groq.com/

### 1. Clone and navigate
```bash
git clone https://github.com/laganchauhan2005-dot/reverse-career-roadmapper.git
cd reverse-career-roadmapper
```

### 2. Backend setup
```bash
cd backend
pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Edit .env and set GROQ_API_KEY=your_real_key_here

# Start the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at: **http://localhost:8000**  
API docs (Swagger): **http://localhost:8000/docs**  
Health check: **http://localhost:8000/health**

### 3. Frontend setup
```bash
cd frontend
npm install

# .env is already set to point at localhost:8000
# If your backend runs elsewhere, edit frontend/.env
# VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | — | Your Groq API key. Get one at https://console.groq.com/ |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173,...` | Comma-separated CORS origins |
| `GROQ_MODEL` | No | `openai/gpt-oss-20b` | Groq model to use |
| `PORT` | No | `8000` | Port (set automatically by Render) |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:8000` | Backend base URL |

> ⚠️ **Never commit `.env` files.** They are listed in `.gitignore`.

---

## Backend API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/roadmap/generate` | Generate personalized roadmap from onboarding data |
| POST | `/api/roadmap/adapt` | Adapt existing roadmap based on completed skills |
| POST | `/api/assistant/explain` | Career explanation or milestone Q&A |
| POST | `/api/resources/recommend` | Get learning resource recommendations |

Full interactive docs at `/docs` when the backend is running.

---

## Deployment

### Frontend → Vercel

1. Connect your GitHub repo to [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Vercel auto-detects Vite. Build command: `npm run build`. Output: `dist`.
4. Add environment variable: `VITE_API_URL=https://your-render-backend.onrender.com`
5. Deploy. The `frontend/vercel.json` handles SPA routing.

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service.
2. Connect your repo. Set **Root Directory** to `backend`.
3. **Environment**: Python 3.  
4. **Build command**: `pip install -r requirements.txt`  
5. **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `GROQ_API_KEY` = your real Groq key
   - `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app`
7. Deploy and copy the `.onrender.com` URL back into Vercel's `VITE_API_URL`.

---

## Resource recommendations

The resources tab uses a hand-curated catalogue of **20 real, verified links** — no AI-generated fake URLs. Resources include:
- freeCodeCamp, The Odin Project, CS50, Khan Academy
- Kaggle Learn, fast.ai, Google Certificates (Data Analytics, UX, Project Management, Marketing)
- Traversy Media, Fireship, 3Blue1Brown, Andrej Karpathy (YouTube)
- HubSpot Academy, Harvard Business School Online
- Stack Overflow, Reddit communities

Catalogue limitations: prices reflect late 2024 rates and may have changed.

---

## Current limitations

- No user accounts — roadmaps persist in browser localStorage only (one device).
- The resource catalogue is curated, not live-scraped. Prices may be outdated.
- The AI model used (`openai/gpt-oss-20b`) may occasionally return malformed JSON; the backend validates and returns a 422 with a clear message in that case.
- Large roadmaps (>20 nodes) may look crowded in the graph. Auto-layout is simple level-based.
- No mobile-specific optimizations for the graph panning/zooming.

---

## License

MIT — see LICENSE file.
