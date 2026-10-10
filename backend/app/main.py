from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api import roadmap, assistant, resources
import os

settings = get_settings()

app = FastAPI(
    title="Reverse Career Roadmapper API",
    version="1.0.0",
    description="AI-powered personalized career roadmap generator",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(roadmap.router)
app.include_router(assistant.router)
app.include_router(resources.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}
