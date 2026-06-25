"""Backend application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes.repository import router as repository_router
from api.routes.history import router as history_router
from database.database import Base, engine

# 1. Database Tables Initialization
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GitHub Repo Analyzer",
    version="1.0.0"
)

# 2. CORS MIDDLEWARE SETUP 
# This will grant the browser permission so that your index.html can connect to the backend without any errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. ROUTERS ASSEMBLE 
# Adding an API prefix is ​​standard practice to keep frontend routes clear.
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
