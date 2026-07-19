# AI Hospital Triage System

An AI-powered patient intake and triage agent that classifies incoming patients into the correct hospital ward and matches them with an available doctor in real time — combining an LLM-based router with hard safety-net rules so urgent cases are never missed.

## Overview

Traditional walk-in triage relies on manual assessment, which can be slow and inconsistent, especially under high patient load. This project automates the first step of that process: a patient describes their symptoms in natural language, and the system:

1. Classifies them into one of three wards — **Emergency**, **Mental Health**, or **General**
2. Applies hard-coded safety-net keyword checks that override the LLM for crisis/emergency language (e.g. chest pain, suicidal ideation) — so a model misclassification can never delay urgent care
3. Checks real-time doctor availability and assigns the patient to the next free specialist in that ward
4. Surfaces the patient on a live-updating **Doctor Portal** dashboard for the assigned doctor to accept

## Architecture

- **Agent workflow**: Built with [LangGraph](https://github.com/langchain-ai/langgraph) as a state graph — Intake → Router → Ward Node → Doctor Availability Check
- **LLM**: [Groq](https://groq.com/) (`llama-3.3-70b-versatile`) for symptom classification
- **Safety layer**: Keyword-based hard overrides for emergency and crisis terms, applied *before* the LLM call — guardrail-first design
- **Backend/Web**: Deployed with a Python backend + web frontend, Postgres for persistence, and authenticated Doctor Portal login
- **Hosting**: Vercel
## Features

- Conversational patient intake (natural-language symptom description)
- Safety-first routing: emergency/crisis keywords always override the model's classification
- Real-time doctor availability lookup from a doctor roster
- Live Doctor Portal for each ward (Emergency, ICU, General Medicine, Pediatrics) to view and accept queued patients
- Reasoning trace stored alongside each triage decision for auditability

## Tech Stack

| Layer | Tools |
|---|---|
| Agent orchestration | LangGraph |
| LLM | Groq (Llama 3.3 70B) |
| Data | Pandas / CSV (doctor roster), Postgres (production) |
| Deployment | Vercel |
| Auth | Session-based login for doctor accounts |

## Getting Started

### Prerequisites
- Python 3.9+
- A [Groq API key](https://console.groq.com/)

### Installation
```bash
pip install -qU langgraph langchain-groq pandas
```

### Environment Variables
### Running locally
```bash
python hospital_agent.py
```
On startup, the intake form will prompt for patient name, age, and symptoms, then route them through the triage graph and print the assigned ward and doctor.

## Doctor Portal Demo Accounts

| Ward | Username | Password |
|---|---|---|
| Emergency | `doctor` | `password` |
| ICU | `icu_doc` | `password` |
| General Medicine | `gen_doc` | `password` |
| Pediatrics | `ped_doc` | `password` |

## Roadmap

- [ ] Expand ward taxonomy beyond three categories
- [ ] Add patient history / follow-up tracking
- [ ] Analytics dashboard for triage accuracy and wait times
- [ ] HIPAA-aligned data handling review

## License

MIT 

## Team

Built by **AlgoNauts**
