from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine, Base

# Core models — must be imported before create_all so all tables are registered
from app.models import models  # noqa: F401  (User, Dept, CarbonCategory, CarbonRecord, etc.)
from app.models import environmental_models  # noqa: F401  (WaterCategory, WaterRecord)

# Routers
from app.api.routers import auth, governance, carbon, water, waste, goals

# Initialize all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoSphere – ESG Management Platform",
    description="Backend API for ESG tracking, environmental management, gamification, and reporting.",
    version="2.0",
)

# ---------------------------------------------------------------------------
# CORS middleware configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)           # Phase 1 – Authentication
app.include_router(governance.router)     # Phase 4 – Governance Module
app.include_router(carbon.router)         # Phase 2 – Carbon Emission Management
app.include_router(water.router)          # Phase 2 – Water Consumption Management
app.include_router(waste.router)          # Phase 2 – Waste Management
app.include_router(goals.router)          # Phase 2 – Sustainability Goals


@app.get("/")
def read_root():
    return {"message": "Welcome to EcoSphere ESG API"}
