from fastapi import APIRouter, HTTPException
from app.schemas.models import ResourceRequest, ResourceResponse
from app.services.roadmap_service import recommend_resources

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.post("/recommend", response_model=ResourceResponse)
async def recommend_endpoint(req: ResourceRequest):
    try:
        items = recommend_resources(req)
        return ResourceResponse(resources=items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching resources: {e}")
