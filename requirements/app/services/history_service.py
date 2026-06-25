from database.database import SessionLocal
from models.history import History

class HistoryService:

    @staticmethod
    def save_history(owner: str, repo: str, health_score: int, risk_level: str):
       # 1. Open a new transaction session.
        db = SessionLocal()
        
        try:
            # 2. History table row instance model ready karein
            history = History(
                owner=owner,
                repo=repo,
                health_score=health_score,
                risk_level=risk_level
            )
            
            # 3. Save the lock by adding the database operation to KOA.
            db.add(history)
            db.commit()
            return True
            
        except Exception as e:
            # 4. Roll back the operation if an error occurs (safe state).
            db.rollback()
            print(f"Database Write Error Log: {str(e)}") # Debug helper terminal log
            return False
            
        finally:
            # 5. Guaranteed close block (the connection will not leak, regardless of whether data saving succeeds or fails)
            db.close()