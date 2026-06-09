"""Backend application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.repository import router as repository_router
from api.routes.history import router as history_router
from database.database import Base, engine

# 1. Database Tables Initialization (Agar table nahi bani toh automatic SQLite me bana dega)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GitHub Repo Analyzer",
    version="1.0.0"
)

# 2. CORS MIDDLEWARE SETUP (Sabse Zaroori Fix)
# Yeh browser ko permission dega taaki aapki index.html bina kisi error ke backend se connect ho sake
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Local testing ke liye saare origins allowed hain
    allow_credentials=True,
    allow_methods=["*"], # GET, POST, OPTIONS saare requests allowed hain
    allow_headers=["*"],
)

# 3. ROUTERS ASSEMBLE 
# /api prefix lagana standard practice hai taaki frontend routes clear rahein
app.include_router(
    repository_router,
    prefix="/api/repository",
    tags=["Repository"]
)

app.include_router(
    history_router,
    prefix="/api/history",
    tags=["History"]
)

@app.get("/")
def read_root():
    return {"status": "Online", "message": "GitHub Repo Analyzer API is running smoothly."}
