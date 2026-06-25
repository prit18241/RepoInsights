from fastapi import APIRouter
from services.github_service import GitHubService
from services.health_score_service import HealthScoreService 
from services.risk_service import RiskService
from services.ai_summary_service import AISummaryService
from services.history_service import HistoryService

router = APIRouter()

# SINGLE SHOT COMPREHENSIVE ANALYSIS ENDPOINT
@router.get("/{owner}/{repo}/analyze")
def analyze_repository(owner: str, repo: str):
    # 1. use for fatching repository data, contributors, commits, languages
    repository = GitHubService.get_repository(owner, repo)
    contributors = GitHubService.get_contributors(owner, repo)
    commits_data = GitHubService.get_commits(owner, repo)
    languages = GitHubService.get_languages(owner, repo)
    
    commits = commits_data.get("commits", [])

    # 2. Compute Metrics (Health, Activity & Risk status)
    activity = HealthScoreService.calculate_activity(commits)
    health = HealthScoreService.calculate_health_score(
        repository=repository,
        contributors=contributors,
        activity_status=activity.get("activity_status", "Unknown")
    )
    
    health_score = health.get("health_score", 0)
    risk = RiskService.calculate_risk(health_score)
    risk_level = risk.get("risk_level", "Unknown")

    # 3. Save to History (Database)
    HistoryService.save_history(
        owner=owner,
        repo=repo,
        health_score=health_score,
        risk_level=risk_level
    )

    # 4. Generate Core AI Recap Payload
    ai_summary = AISummaryService.generate_summary(
        repository_name=repository.get("name", repo),
        health_score=health_score,
        risk_level=risk_level,
        activity_status=activity.get("activity_status", "Unknown"),
        contributors_count=len(contributors),
        stars=repository.get("stars", 0),
        open_issues=repository.get("open_issues", 0)
    )

    # Combined structural response directly matching app.js requirements!
    return {
        "repository": repository,
        "languages": languages,
        "contributors": contributors,
        "commits_data": commits_data,
        "health": health,
        "risk": risk,
        "ai_summary": ai_summary
    }

# STANDARD GRANULAR PASS-THROUGH ENDPOINTS
@router.get("/{owner}/{repo}")
def get_repository_base(owner: str, repo: str):
    return GitHubService.get_repository(owner, repo)

@router.get("/{owner}/{repo}/languages")
def get_repository_languages(owner: str, repo: str):
    return GitHubService.get_languages(owner, repo)

@router.get("/{owner}/{repo}/contributors")
def get_repository_contributors(owner: str, repo: str):
    return GitHubService.get_contributors(owner, repo)