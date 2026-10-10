from fastapi import APIRouter, HTTPException
from app.schemas.models import ExplainRequest, ExplainResponse
from app.services.roadmap_service import explain_career

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/explain", response_model=ExplainResponse)
async def explain_endpoint(req: ExplainRequest):
    try:
        text = explain_career(req)
        return ExplainResponse(explanation=text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
