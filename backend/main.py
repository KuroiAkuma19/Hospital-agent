import os
import json
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from database import engine, Base, get_db
import models
import auth
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db(db: Session):
    if not db.query(models.Doctor).first():
        doctors = [
            models.Doctor(username="doctor", hashed_password=auth.get_password_hash("password"), full_name="Dr. Smith", ward="EMERGENCY", status="available"),
            models.Doctor(username="icu_doc", hashed_password=auth.get_password_hash("password"), full_name="Dr. Sarah Connor", ward="ICU", status="available"),
            models.Doctor(username="gen_doc", hashed_password=auth.get_password_hash("password"), full_name="Dr. Gregory House", ward="GENERAL", status="available"),
            models.Doctor(username="ped_doc", hashed_password=auth.get_password_hash("password"), full_name="Dr. Meredith Grey", ward="PEDIATRICS", status="available"),
        ]
        db.add_all(doctors)
        db.commit()

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    init_db(db)

# --- Groq Integration ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    patient_name: str
    age: int
    chat_history: List[Message]

def evaluate_triage_chat(patient_name: str, age: int, history: List[Message]):
    if not groq_client:
        return {"decision": "general", "reasoning": "No Groq API key"}

    system_prompt = f"""You are an expert AI triage agent in a hospital.
You are chatting with a patient named {patient_name}, age {age}.
Your goal is to figure out their symptoms and decide which ward they need (EMERGENCY, GENERAL, ICU, PEDIATRICS).
If you need more info, reply with a question to the user.
If you have enough info, output a raw JSON block and NOTHING ELSE:
{{
    "decision": "<WARD>",
    "reasoning": "<brief reasoning>"
}}
"""
    
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
        
    try:
        completion = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.2,
        )
        content = completion.choices[0].message.content.strip()
        if content.startswith("{") and content.endswith("}"):
            try:
                return json.loads(content)
            except:
                pass
        return content
    except Exception as e:
        return f"Error connecting to AI: {str(e)}"

# --- Routes ---

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Doctor).filter(models.Doctor.username == req.username).first()
    if not user:
        print(f"Login failed: user {req.username} not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not auth.verify_password(req.password, user.hashed_password):
        print(f"Login failed: invalid password for {req.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "full_name": user.full_name}

@app.post("/api/chat")
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    history = req.chat_history
    if not history:
        return {"triage_complete": False, "reply": f"Hello {req.patient_name}. Please describe your symptoms or reason for visit today."}
        
    result = evaluate_triage_chat(req.patient_name, req.age, history)
    
    if isinstance(result, dict):
        ward = result.get("decision", "general")
        
        assigned_doctor = "Pending Assignment"
        available_doc = db.query(models.Doctor).filter(
            models.Doctor.ward == ward,
            models.Doctor.status == "available"
        ).first()
        
        if available_doc:
            assigned_doctor = available_doc.full_name
            available_doc.status = "busy"
            
        new_queue_item = models.PatientQueue(
            patient_name=req.patient_name,
            age=req.age,
            symptoms=history[0].content if history else "",
            ward=ward,
            assigned_doctor=assigned_doctor,
            reasoning=result.get("reasoning", ""),
            status="waiting"
        )
        db.add(new_queue_item)
        db.commit()
        db.refresh(new_queue_item)
        
        return {
            "triage_complete": True,
            "ward": ward,
            "assigned_doctor": assigned_doctor,
            "reasoning": result.get("reasoning", ""),
            "queue_id": new_queue_item.id
        }
    else:
        return {"triage_complete": False, "reply": result}

@app.get("/api/queue/{queue_id}/status")
def get_queue_status(queue_id: int, db: Session = Depends(get_db)):
    item = db.query(models.PatientQueue).filter(models.PatientQueue.id == queue_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    return {"status": item.status, "assigned_doctor": item.assigned_doctor}

@app.get("/doctor/queue")
def get_doctor_queue(db: Session = Depends(get_db), current_user: models.Doctor = Depends(auth.get_current_user)):
    patients = db.query(models.PatientQueue).filter(
        models.PatientQueue.status == "waiting",
        # models.PatientQueue.ward == current_user.ward # Optional: only see own ward
    ).all()
    return patients

@app.post("/api/queue/{item_id}/accept")
def accept_queue_item(item_id: int, db: Session = Depends(get_db), current_user: models.Doctor = Depends(auth.get_current_user)):
    item = db.query(models.PatientQueue).filter(models.PatientQueue.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.status = "accepted"
    item.assigned_doctor = current_user.full_name
    db.commit()
    return {"message": "Accepted"}
