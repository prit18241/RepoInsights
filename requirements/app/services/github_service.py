import os
import requests
from dotenv import load_dotenv

load_dotenv()

class GitHubService:
    BASE_URL = "https://api.github.com"
    
    # 1. Read GitHub token from environment variables (secure API calls)
    TOKEN = os.getenv("GITHUB_TOKEN") 
    HEADERS = {
        "Accept": "application/vnd.github+json",
    }
    if TOKEN:
        HEADERS["Authorization"] = f"token {TOKEN}"

    @staticmethod
    def get_repository(owner: str, repo: str):
        url = f"{GitHubService.BASE_URL}/repos/{owner}/{repo}"
        try:
            response = requests.get(url, headers=GitHubService.HEADERS)
            if response.status_code != 200:
                return {"name": repo, "stars": 0, "forks": 0, "open_issues": 0, "description": "Repository context error or offline."}
            
            data = response.json()
            return {
                "name": data.get("name"),
                "owner": data.get("owner", {}).get("login"),
                "description": data.get("description", ""),
                "stars": data.get("stargazers_count", 0),
                "forks": data.get("forks_count", 0),
                "watchers": data.get("watchers_count", 0),
                "open_issues": data.get("open_issues_count", 0),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "html_url": data.get("html_url"),
                "default_branch": data.get("default_branch", "main")
            }
        except Exception:
            return {"name": repo, "stars": 0, "forks": 0, "open_issues": 0}

    @staticmethod
    def get_languages(owner: str, repo: str):
        url = f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/languages"
        try:
            response = requests.get(url, headers=GitHubService.HEADERS)
            return response.json() if response.status_code == 200 else {}
        except Exception:
            return {}
    
    @staticmethod
    def get_contributors(owner: str, repo: str):
        url = f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/contributors"
        try:
            response = requests.get(url, headers=GitHubService.HEADERS)
            if response.status_code != 200:
                return []
            
            contributors = response.json()
            # Returning a flat array directly to avoid breaking the format in repository.py
            return [
                {
                    "username": c.get("login"),
                    "contributions": c.get("contributions", 0),
                    "avatar_url": c.get("avatar_url")
                }
                for c in contributors[:15]# Top 15 contributors selected for dashboard charts
            ]
        except Exception:
            return []
    
    @staticmethod
    def get_commits(owner: str, repo: str):
        url = f"{GitHubService.BASE_URL}/repos/{owner}/{repo}/commits"
        try:
            response = requests.get(url, headers=GitHubService.HEADERS)
            if response.status_code != 200:
                return [] # Remove the wrapper and use the raw array directly.
            
            commits = response.json()
            # Direct flat list return without "commits" wrapper object
            return [
                {
                    "author": commit.get("commit", {}).get("author", {}).get("name", "Unknown"),
                    "message": (commit.get("commit", {}).get("message") or "No message").split("\n")[0],
                    "date": commit.get("commit", {}).get("author", {}).get("date")
                }
                for commit in commits[:26]
            ]
        except Exception:
            return [] #Backup Empty List