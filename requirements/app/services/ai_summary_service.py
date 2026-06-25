import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# 1. set API Configuration at global level
api_key = os.getenv("GENAI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class AISummaryService:
    @staticmethod
    def generate_summary(
        repository_name,
        health_score,
        risk_level,
        activity_status,
        contributors_count,
        stars,
        open_issues
    ):
        # 2. Modern Time timezone safe lightweight engine configureation
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = f"""
        Analyze this GitHub repository profile and provide a professional executive summary.
        
        Repository Name: {repository_name}
        Health Score: {health_score}/100
        Risk Level: {risk_level}
        Activity Status: {activity_status}
        Contributors Count: {contributors_count}
        Stars: {stars}
        Open Issues: {open_issues}

        Provide a concise paragraph covering:
        1. Repository overall health assessment
        2. Maintenance cadence observations
        3. Adoption recommendation

        Constraint: Keep the entire output strictly under 100 words. Do not use markdown headers.
        """
        
        try:
            # 3. Removed the list models loop, fetching will now happen directly and instantly.
            response = model.generate_content(prompt)
            return {
                "summary": response.text.strip()
            }
        except Exception as e:
            # 4. Fallback handler will return data in ready format
            print(f"Gemini API Error Log: {str(e)}") # Debugging helper log
            return {
                "summary": f"Repository '{repository_name}' has a health score of {health_score}/100 and a risk level of {risk_level}. (Note: AI service is temporarily offline, showing fallback analysis based on raw metrics)."
            }