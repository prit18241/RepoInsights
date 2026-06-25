from datetime import datetime, timezone

class HealthScoreService:

    @staticmethod
    def calculate_activity(commits):
       # 1. Edge-case safety guard (if the commits array is empty)
        if not commits or len(commits) == 0:
          return {
              "activity_status": "Abandoned",
              "days_since_last_commit": 365
          }

        try:
            # GitHub API payload structure safe extract check
            latest_commit = commits[0]
           # Check if the dictionary is in a raw wrapper.
            if "date" not in latest_commit and "commit" in latest_commit:
                latest_commit_date = latest_commit["commit"]["author"]["date"]
            else:
                latest_commit_date = latest_commit.get("date")

            if not latest_commit_date:
                raise ValueError("Date field missing")

            latest_date = datetime.fromisoformat(latest_commit_date.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            days_since_last_commit = (now - latest_date).days
            
          # Static metrics definitions mapping to frontend strings matching
            if days_since_last_commit <= 7:
                status = "Very Active"
            elif days_since_last_commit <= 30:
                status = "Active"
            elif days_since_last_commit <= 90:
                status = "Moderate"
            else:
                status = "Inactive"
                
            return {
                "activity_status": status,
                "days_since_last_commit": max(0, days_since_last_commit)
            }
        except Exception:
            return {"activity_status": "Inactive", "days_since_last_commit": 180}

    @staticmethod
    def calculate_health_score(repository, contributors, activity_status):
        score = 0

        # Dimension 1: Activity Status Score (Max 30)
        if activity_status == "Very Active":
            score += 30
        elif activity_status == "Active":
            score += 20
        elif activity_status == "Moderate":
            score += 10
        else:
            score += 5

        # Dimension 2: Contributor Velocity Base (Max 20)
        cl = len(contributors) if isinstance(contributors, list) else 0
        if cl >= 15:
            score += 20
        elif cl >= 5:
            score += 12
        else:
            score += 5

        # Dimension 3: Adoption Popularity Scales (Max 25)
        stars = repository.get("stars", 0)
        if stars >= 5000:
          score += 25
        elif stars >= 500:
          score += 15
        else:
          score += 5

        # Dimension 4: Quality Tracking Issues Backlog (Max 15)
        issues = repository.get("open_issues", 0)
        if issues <= 30:
            score += 15
        elif issues <= 150:
            score += 10
        else:
            score += 5

        # Dimension 5: Legal Compliance Integration (Max 10) -> Math Fixes to hit 100/100 max boundary!
       # +10 bonus points if the repository has a proper open-source license set up.
        if repository.get("license") or repository.get("license_id"):
            score += 10

        return {
            "health_score": min(100, score)
        }