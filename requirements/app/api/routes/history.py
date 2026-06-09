from fastapi import APIRouter, Depends
from database.database import SessionLocal
from models.history import History

router = APIRouter()

# ── DATABASE DEPENDENCY CRADLE ──
# Yeh function automatic connection open aur close karne ka dhyan rakhega
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_history(db=Depends(get_db)):
    # 1. Database se saari history fetch karein
    history = db.query(History).all()
    
    # 2. Python shorthand loop se data object return karein (Easy & Fast)
    return [
        {
            "id": item.id,
            "owner": item.owner,
            "repo": item.repo,
            "health_score": item.health_score,
            "risk_level": item.risk_level,
            "analyzed_at": item.analyzed_at
        }
        for item in history
    ]