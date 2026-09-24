"""
api.py — FastAPI backend for PR Decorations Chat Widget

This exposes the RAG retriever logic as a simple REST API endpoint.
It allows any frontend (React, HTML/JS, etc.) to query the knowledge base
without being tightly coupled to Python or Streamlit.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from rag.retriever import retrieve
from rag.vectorstore import get_collection, build_vectorstore

app = FastAPI(title="PR Decorations RAG API")

# Allow requests from the frontend widget (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from chatbot import get_response

# ------------------------------------------------------------------
# Data Models
# ------------------------------------------------------------------
class AskRequest(BaseModel):
    question: str

class Chunk(BaseModel):
    text: str
    source: str
    category: str
    distance: float

class AskResponse(BaseModel):
    answer: str
    chunks: list[Chunk]

# ------------------------------------------------------------------
# API Endpoints
# ------------------------------------------------------------------
@app.post("/ask", response_model=AskResponse)
def ask_question(request: AskRequest):
    """
    Accepts a question, retrieves context, and uses Groq to generate a natural response.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    # get_response returns {"answer": str, "chunks": list}
    result = get_response(request.question)

    return AskResponse(
        answer=result["answer"],
        chunks=result["chunks"]
    )

@app.get("/health")
def health_check():
    """Check if the vector store is ready."""
    collection = get_collection()
    if collection and collection.count() > 0:
        return {"status": "ready", "chunks": collection.count()}
    else:
        # Automatically try to build it if it doesn't exist
        try:
            build_vectorstore()
            collection = get_collection()
            return {"status": "built", "chunks": collection.count()}
        except Exception as e:
            return {"status": "error", "detail": str(e)}

# ------------------------------------------------------------------
# Quick Start for Testing
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    # Make sure vectorstore exists before starting
    health_check()
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
