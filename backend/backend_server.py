from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="My AI Video Studio Local Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OWNER_PIN = os.getenv("STUDIO_PIN", "2026")

class PinRequest(BaseModel):
    pin: str

@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}

@app.post("/auth/verify")
def verify_pin(req: PinRequest):
    if req.pin == OWNER_PIN:
        return {"authenticated": True}
    raise HTTPException(status_code=401, detail="Invalid PIN")
