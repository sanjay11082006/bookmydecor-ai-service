"""
chatbot.py — Connects the RAG retriever to Groq API.

Takes the user question, retrieves knowledge, builds the prompt,
and calls the Groq Cloud LLM for a natural-language response.
"""

import os
from dotenv import load_dotenv
from groq import Groq

from rag.retriever import retrieve
from prompt import build_prompt

# ------------------------------------------------------------------
# Initialization: Load Groq API
# ------------------------------------------------------------------
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Safe debugging — never print the actual key
print("Groq key loaded:", bool(GROQ_API_KEY))
print("Groq key length:", len(GROQ_API_KEY) if GROQ_API_KEY else 0)
print("Groq model:", GROQ_MODEL)

if not GROQ_API_KEY:
    print("[STARTUP ERROR] GROQ_API_KEY is not set. Set it as an environment variable on the server.")

# Initialize the Groq Client (will fail gracefully per-request if key is missing)
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def format_context(chunks):
    """Formats the raw chunks into a string for the prompt."""
    if not chunks:
        return ""
    
    parts = []
    for c in chunks:
        parts.append(f"[Source: {c['source']} | Category: {c['category']}]\n{c['text']}")
    return "\n\n---\n\n".join(parts)


def get_response(user_question):
    """
    1. Retrieves relevant PR Decorations context.
    2. Runs the Groq API to answer the question using ONLY that context.
    
    Returns a dictionary:
      {
         "answer": "The natural language answer",
         "chunks": [list of retrieved chunks for the UI sources expander]
      }
    """
    # 1. Retrieve knowledge
    chunks = retrieve(user_question)

    # Detect conversational/greeting messages that don't need RAG context
    conversational_keywords = [
        "hi", "hello", "hey", "thanks", "thank you", "thankyou",
        "bye", "goodbye", "ok", "okay", "great", "awesome", "cool"
    ]
    is_greeting = user_question.strip().lower() in conversational_keywords

    # If NO relevant chunks are found and it's not a greeting, use strict fallback.
    if not chunks and not is_greeting:
        return {
            "answer": "I don't have that information available right now. Please contact PR Decorations directly for the most accurate answer.",
            "chunks": []
        }

    # 2. Format context and build the prompt
    context_str = format_context(chunks)
    system_prompt = build_prompt(context_str)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_question}
    ]

    # 3. Generate response using the Groq API
    if client is None:
        error_msg = "[CONFIG ERROR] GROQ_API_KEY is missing from environment variables."
        print(error_msg)
        return {
            "answer": f"⚠️ {error_msg} Please set GROQ_API_KEY on the server.",
            "chunks": chunks
        }

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=300,
            temperature=0.1,  # Low temperature for factual RAG responses
        )
        
        answer = response.choices[0].message.content.strip()
        
        return {
            "answer": answer,
            "chunks": chunks
        }
    except Exception as e:
        # Log the EXACT error — critical for diagnosing production failures
        error_type = type(e).__name__
        error_detail = str(e)
        print(f"[GROQ ERROR] {error_type}: {error_detail}")
        print(f"[GROQ ERROR] Model used: {GROQ_MODEL}")
        print(f"[GROQ ERROR] Key present: {bool(GROQ_API_KEY)}")

        # Return a diagnostic message so you can see what went wrong in the network tab
        return {
            "answer": f"[GROQ ERROR — {error_type}] {error_detail}",
            "chunks": chunks
        }
