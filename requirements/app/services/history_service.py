from database.database import SessionLocal
from models.history import History

class HistoryService:

    @staticmethod
    def save_history(owner: str, repo: str, health_score: int, risk_level: str):
        # 1. New Transaction Session Open Karein
        db = SessionLocal()
        
        try:
            # 2. History table row instance model ready karein
            history = History(
                owner=owner,
                repo=repo,
                health_score=health_score,
                risk_level=risk_level
            )
            
            # 3. Database operation queue me add karke lock save karein
            db.add(history)
            db.commit()
            return True
            
        except Exception as e:
            # 4. Agar koi error aaye toh operation rollback karein (Safe State)
            db.rollback()
            print(f"Database Write Error Log: {str(e)}") # Debug helper terminal log
            return False
            
        finally:
            # 5. Guaranteed Close Block (Chahe data save ho ya fail, connection leak nahi hoga)
            db.close()