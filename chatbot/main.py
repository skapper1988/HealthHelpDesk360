from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import httpx
from rag_pipeline import process_query

app = FastAPI(title="HealthHelpDesk360 Chatbot Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str

class TicketData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    subject: str
    category: str
    description: str
    priority: str = "medium"

class ChatResponse(BaseModel):
    message: str
    create_ticket: bool = False
    ticket_data: Optional[TicketData] = None

@app.get("/")
def read_root():
    return {"status": "ok", "service": "HealthHelpDesk360 Chatbot"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Process the message through RAG pipeline
        response = process_query(request.message, request.session_id)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@app.post("/create-ticket")
async def create_ticket(ticket_data: TicketData):
    try:
        # In a real implementation, this would call the backend API
        # to create a ticket in the system
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8000/api/tickets",
                json=ticket_data.dict(),
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Error creating ticket: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ticket: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
