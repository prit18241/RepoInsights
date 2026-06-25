from fastapi import APIRouter, Depends
from database.database import SessionLocal
from models.history import History

router = APIRouter()

# ── DATABASE DEPENDENCY CRADLE ──
# use for connection open and close
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_history(db=Depends(get_db)):
    # use for data base history fetching
    history = db.query(History).all()
    
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