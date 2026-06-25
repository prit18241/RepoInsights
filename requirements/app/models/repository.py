from pydantic import BaseModel
from typing import Optional, List

# REPOSITORY VALIDATION SCHEMA (Pydantic Model) 
class RepositoryResponse(BaseModel):
    id: int
    name: str
    full_name: str
    owner_login: str
    avatar_url: str
    description: Optional[str] = "No description provided."
    html_url: str
    homepage: Optional[str] = None
    
    # Core Dashboard Counters (Directly used in app.js)
    stars: int
    forks: int
    watchers: int
    open_issues: int
    
    # Project Configurations
    default_branch: str = "main"
    language: Optional[str] = "N/A"
    license_id: Optional[str] = "None"
    topics: List[str] = []