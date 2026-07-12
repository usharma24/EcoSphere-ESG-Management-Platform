from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base
from app.api.routers import auth, governance
from app.api.routers import gamification
from app.models import gamification as gamification_models
# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EcoSphere – ESG Management Platform",
    description="Backend API for ESG tracking, gamification, and reporting.",
    version="1.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development. Can be restricted in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(governance.router)
app.include_router(
    gamification.router,
    prefix="/api/gamification",
    tags=["Gamification"]
)


@app.get("/")
def read_root():
    return {"message": "Welcome to EcoSphere ESG API"}
