from fastapi import APIRouter, HTTPException
from app.schemas.models import (
    GenerateRoadmapRequest, GenerateRoadmapResponse,
    AdaptRoadmapRequest, AdaptRoadmapResponse,
)
from app.services.roadmap_service import generate_roadmap, adapt_roadmap

router = APIRouter(prefix="/api/roadmap", tags=["roadmap"])


@router.post("/generate", response_model=GenerateRoadmapResponse)
async def generate_roadmap_endpoint(req: GenerateRoadmapRequest):
    try:
        roadmap = generate_roadmap(req)
        return GenerateRoadmapResponse(roadmap=roadmap)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"AI returned invalid roadmap structure: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error generating roadmap: {e}")


@router.post("/adapt", response_model=AdaptRoadmapResponse)
async def adapt_roadmap_endpoint(req: AdaptRoadmapRequest):
    try:
        roadmap, changes = adapt_roadmap(req)
        return AdaptRoadmapResponse(roadmap=roadmap, changes_summary=changes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"AI returned invalid adapted roadmap: {e}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error adapting roadmap: {e}")
