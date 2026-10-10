from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
import re


# ---------------------------------------------------------------------------
# Shared primitives
# ---------------------------------------------------------------------------

class SkillNode(BaseModel):
    id: str = Field(..., description="Unique slug, e.g. 'python-basics'")
    label: str
    category: Literal[
        "foundation", "technical", "soft_skill", "tool", "domain", "project", "milestone"
    ]
    description: str
    estimated_hours: float = Field(..., ge=0)
    prerequisites: list[str] = Field(default_factory=list)
    resources: list[str] = Field(default_factory=list, description="Short resource hints")
    level: int = Field(default=1, ge=1, description="Graph depth level")
    status: Literal["not_started", "in_progress", "completed"] = "not_started"


class RoadmapEdge(BaseModel):
    source: str
    target: str


class Roadmap(BaseModel):
    id: str
    occupation: str
    nodes: list[SkillNode]
    edges: list[RoadmapEdge]
    total_estimated_hours: float = Field(ge=0)
    summary: str

    @field_validator("nodes")
    @classmethod
    def unique_ids(cls, nodes: list[SkillNode]) -> list[SkillNode]:
        ids = [n.id for n in nodes]
        if len(ids) != len(set(ids)):
            dups = {i for i in ids if ids.count(i) > 1}
            raise ValueError(f"Duplicate node IDs: {dups}")
        return nodes

    @field_validator("nodes")
    @classmethod
    def valid_prerequisites(cls, nodes: list[SkillNode]) -> list[SkillNode]:
        node_ids = {n.id for n in nodes}
        for node in nodes:
            bad = [p for p in node.prerequisites if p not in node_ids]
            if bad:
                raise ValueError(f"Node '{node.id}' references unknown prerequisites: {bad}")
        return nodes

    @field_validator("edges")
    @classmethod
    def valid_edge_refs(cls, edges: list[RoadmapEdge], info) -> list[RoadmapEdge]:
        # nodes may not be validated yet in all pydantic versions; be defensive
        return edges


# ---------------------------------------------------------------------------
# API request / response models
# ---------------------------------------------------------------------------

class OnboardingData(BaseModel):
    occupation: str = Field(..., min_length=2, max_length=200)
    current_level: Literal["complete_beginner", "some_experience", "intermediate", "advanced"]
    known_skills: list[str] = Field(default_factory=list)
    hours_per_week: float = Field(..., ge=1, le=168)
    target_months: int = Field(..., ge=1, le=120)
    learning_preferences: list[str] = Field(default_factory=list)
    budget: Literal["free", "low", "medium", "high"]


class GenerateRoadmapRequest(BaseModel):
    onboarding: OnboardingData


class GenerateRoadmapResponse(BaseModel):
    roadmap: Roadmap


class AdaptRoadmapRequest(BaseModel):
    roadmap: Roadmap
    completed_skill_ids: list[str]
    updated_onboarding: Optional[OnboardingData] = None


class AdaptRoadmapResponse(BaseModel):
    roadmap: Roadmap
    changes_summary: str


class ExplainRequest(BaseModel):
    occupation: str
    question: Optional[str] = None
    context: Optional[str] = None  # e.g. a node label/description for follow-up


class ExplainResponse(BaseModel):
    explanation: str


class ResourceRequest(BaseModel):
    occupation: str
    skills: list[str]
    budget: Literal["free", "low", "medium", "high"]
    current_level: str


class ResourceItem(BaseModel):
    title: str
    provider: str
    url: str
    type: Literal["video", "course", "article", "book", "community"]
    cost: str  # "Free", "$15", "~$30/mo", etc.
    skill_tags: list[str]
    description: str


class ResourceResponse(BaseModel):
    resources: list[ResourceItem]
