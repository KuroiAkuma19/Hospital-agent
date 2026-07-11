import os
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

SYSTEM_PROMPT = """You are a highly capable hospital triage assistant. 
Your goal is to gather enough information from the patient to classify them into one of these wards:
- emergency: life-threatening or urgent physical conditions
- mental_health: psychological/emotional distress or crisis
- general: routine checkups, mild/chronic non-urgent symptoms

Rules:
1. If you need more information to make a safe decision, ask the patient ONE follow-up question.
2. If you have enough information, reply with EXACTLY this JSON format (no markdown, no extra text):
   {"decision": "ward_name", "reasoning": "your reasoning in English"}
   Where ward_name is either 'emergency', 'mental_health', or 'general'.
3. MULTI-LINGUAL SUPPORT: You MUST reply in the same language the patient is using for all conversational responses. However, if you are making a final decision (returning JSON), the JSON MUST be in English.
4. Hard safety-net keywords: If the patient mentions suicide, self-harm, severe chest pain, or severe bleeding, route them immediately to the appropriate emergency/mental_health ward.
"""

def evaluate_triage_chat(chat_history):
    """
    chat_history is a list of dicts: [{"role": "user"|"assistant", "content": "..."}]
    Returns either a string (assistant's next question) or a dict with the final decision.
    """
    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for msg in chat_history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        else:
            messages.append(AIMessage(content=msg["content"]))
            
    response = llm.invoke(messages)
    content = response.content.strip()
    
    if content.startswith("{") and "decision" in content:
        import json
        try:
            decision_data = json.loads(content)
            return decision_data
        except Exception:
            pass
            
    return content