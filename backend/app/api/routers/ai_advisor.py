import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import AILog, User
from app.schemas.schemas import AIPrompt, AIResponse
from app.core.config import settings as app_settings
from app.api.routers.auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["AI Advisor"])


@router.post("/ask", response_model=AIResponse)
async def ask_advisor(
    data: AIPrompt,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a prompt to Gemini API and return ESG-focused recommendations."""
    gemini_key = app_settings.GEMINI_API_KEY

    if not gemini_key:
        # Fallback: return a mock response when no API key is configured
        ai_response = _mock_response(data.prompt)
    else:
        ai_response = await _call_gemini(gemini_key, data.prompt)

    log = AILog(
        user_id=current_user.id,
        prompt=data.prompt,
        response=ai_response,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@router.get("/history", response_model=List[AIResponse])
def advisor_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(AILog)
        .filter(AILog.user_id == current_user.id)
        .order_by(AILog.created_at.desc())
        .limit(20)
        .all()
    )


async def _call_gemini(api_key: str, prompt: str) -> str:
    """Call the Google Gemini API."""
    import httpx

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    system_instruction = (
        "You are EcoSphere AI Advisor, an expert in ESG (Environmental, Social & Governance) management. "
        "Provide actionable, data-driven sustainability recommendations. "
        "Focus on carbon reduction, energy efficiency, social impact, and governance best practices. "
        "Keep responses concise and practical."
    )

    payload = {
        "contents": [{"parts": [{"text": f"{system_instruction}\n\nUser question: {prompt}"}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            result = resp.json()
            return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"AI service temporarily unavailable. Error: {str(e)}"


def _mock_response(prompt: str) -> str:
    """Provide a helpful mock response when Gemini API key is not configured."""
    prompt_lower = prompt.lower()
    if "carbon" in prompt_lower or "emission" in prompt_lower:
        return (
            "🌱 **Carbon Reduction Recommendations:**\n\n"
            "1. **Switch to renewable energy** – Install solar panels or purchase green energy credits\n"
            "2. **Optimize logistics** – Consolidate shipments and use electric vehicles\n"
            "3. **Remote work policies** – Reduce commuting emissions by 30-40%\n"
            "4. **Carbon offsetting** – Invest in verified offset projects\n"
            "5. **Energy audits** – Conduct quarterly audits to identify waste\n\n"
            "💡 *Tip: Start with Scope 1 & 2 emissions before tackling Scope 3.*"
        )
    elif "social" in prompt_lower or "dei" in prompt_lower or "diversity" in prompt_lower:
        return (
            "👥 **Social Impact Recommendations:**\n\n"
            "1. **DEI Training** – Implement unconscious bias training quarterly\n"
            "2. **Community engagement** – Partner with local NGOs for volunteering\n"
            "3. **Employee wellbeing** – Launch mental health support programs\n"
            "4. **Pay equity** – Conduct annual salary gap analysis\n"
            "5. **Supply chain audits** – Ensure ethical labor practices\n\n"
            "💡 *Tip: Set measurable DEI targets and report progress annually.*"
        )
    elif "governance" in prompt_lower or "compliance" in prompt_lower:
        return (
            "⚖️ **Governance Best Practices:**\n\n"
            "1. **Board diversity** – Aim for 40% underrepresented groups\n"
            "2. **Whistleblower protection** – Establish anonymous reporting channels\n"
            "3. **Anti-corruption policy** – Regular training and audits\n"
            "4. **Data privacy** – GDPR/CCPA compliance review\n"
            "5. **ESG reporting** – Align with GRI/SASB/TCFD frameworks\n\n"
            "💡 *Tip: Regular board ESG training increases accountability.*"
        )
    else:
        return (
            "🌍 **ESG Strategy Recommendations:**\n\n"
            "1. **Set science-based targets** – Align with SBTi for emission reduction\n"
            "2. **Materiality assessment** – Identify your top ESG priorities\n"
            "3. **Stakeholder engagement** – Survey employees, investors, and community\n"
            "4. **Digital transformation** – Use IoT sensors for real-time monitoring\n"
            "5. **Annual ESG report** – Publish transparent sustainability metrics\n\n"
            "💡 *Ask me about specific areas: carbon, social impact, or governance!*"
        )
