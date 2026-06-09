class RiskService:

    @staticmethod
    def calculate_risk(health_score: int):
        # 1. Fallback guardrails scale checking
        if health_score is None:
            health_score = 0
            
        # 2. String classification precisely matched to app.js dictionary rules!
        if health_score >= 75:
            risk_level = "Low"
        elif health_score >= 45:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        return {
            "risk_level": risk_level
        }