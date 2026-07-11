from sqlalchemy import Column, Integer, String
from .database import Base

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    ward = Column(String)
    status = Column(String, default="available") # "available" or "busy"

class PatientQueue(Base):
    __tablename__ = "patient_queue"
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String, index=True)
    age = Column(Integer)
    symptoms = Column(String)
    ward = Column(String)
    assigned_doctor = Column(String)
    reasoning = Column(String)
    status = Column(String, default="waiting") # "waiting" or "accepted"
