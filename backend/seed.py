import sys
import os
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend import models, auth

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()

    if not db.query(models.User).filter_by(username="admin").first():
        admin = models.User(
            username="admin", 
            hashed_password=auth.get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)

    try:
        df = pd.read_csv("doctors.csv")
        for _, row in df.iterrows():

            doc_username = row['doctor_name'].lower().replace(" ", "_").replace(".", "")
            if not db.query(models.User).filter_by(username=doc_username).first():
                doc_user = models.User(
                    username=doc_username,
                    hashed_password=auth.get_password_hash("doctor123"),
                    role="doctor"
                )
                db.add(doc_user)
                db.flush()
                
                doc_avail = models.DoctorAvailability(
                    doctor_name=row['doctor_name'],
                    ward=row['ward'],
                    status="available",
                    user_id=doc_user.id
                )
                db.add(doc_avail)
    except Exception as e:
        print("Could not seed doctors:", e)

    db.commit()
    db.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
