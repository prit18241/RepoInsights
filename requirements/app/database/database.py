from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# 1. Database URL Connection Path Configuration
DATABASE_URL = "sqlite:///./history.db"

# 2. Database Engine Engine Setup
engine = create_engine(
    DATABASE_URL,
    # FastAPI concurrent multi-threading safely handle karne ke liye
    connect_args={"check_same_thread": False}
)

# 3. Operations Database Session Controller
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 4. Modern SQLAlchemy 2.0 Class-Based Declarative Base (Clean & Type-Safe)
class Base(DeclarativeBase):
    pass