import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import auth

def seed_doctors():
    db = SessionLocal()
    
    additional_doctors = [
        {"username": "icu_doc", "password": "password", "full_name": "Dr. Sarah Connor", "ward": "ICU"},
        {"username": "gen_doc", "password": "password", "full_name": "Dr. Gregory House", "ward": "GENERAL"},
        {"username": "ped_doc", "password": "password", "full_name": "Dr. Meredith Grey", "ward": "PEDIATRICS"},
    ]
    
    for doc_data in additional_doctors:
        existing = db.query(models.Doctor).filter(models.Doctor.username == doc_data["username"]).first()
        if not existing:
            new_doc = models.Doctor(
                username=doc_data["username"],
                hashed_password=auth.get_password_hash(doc_data["password"]),
                full_name=doc_data["full_name"],
                ward=doc_data["ward"],
                status="available"
            )
            db.add(new_doc)
            print(f"Added {doc_data['full_name']} ({doc_data['ward']})")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_doctors()
    print("Done seeding doctors.")
