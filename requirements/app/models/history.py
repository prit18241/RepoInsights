from datetime import datetime, timezone
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime

from database.database import Base

class History(Base):
    __tablename__ = "history"

    # 1. Primary Key Column
    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # 2. Repository Information Columns (Clean Strings)
    owner: Mapped[str] = mapped_column(String)
    repo: Mapped[str] = mapped_column(String)

    # 3. Assessment Metrics Columns
    health_score: Mapped[int] = mapped_column()
    risk_level: Mapped[str] = mapped_column(String)

    # 4. Modern Timestamp Setup (Timezone Safe)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc)
    )