from fastapi import APIRouter
from app.api.v1.endpoints import lookup, ingest, marketplaces, admin, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(lookup.router, prefix="/lookup", tags=["lookup"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
api_router.include_router(marketplaces.router, prefix="/marketplaces", tags=["marketplaces"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
