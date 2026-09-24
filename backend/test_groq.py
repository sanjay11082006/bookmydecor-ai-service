"""
test_groq.py — Isolated Groq API connection test.

Tests ONLY the Groq API connection without RAG.
Run: python test_groq.py   (from the backend/ directory)
"""

from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()

key = os.getenv("GROQ_API_KEY")
model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

print("Groq key loaded:", bool(key))
print("Groq key length:", len(key) if key else 0)
print("Groq model:", model)

if not key:
    print("\nERROR: GROQ_API_KEY is empty in .env")
    print("Get a free key at: https://console.groq.com/keys")
    exit(1)

try:
    client = Groq(api_key=key)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": "Reply with exactly: GROQ TEST OK"}
        ],
        max_tokens=20
    )

    result = response.choices[0].message.content
    print(f"\nRESULT: {result}")

    if "GROQ TEST OK" in result:
        print("STATUS: PASS")
    else:
        print("STATUS: UNEXPECTED RESPONSE (but API works)")

except Exception as e:
    print(f"\nGROQ ERROR TYPE: {type(e).__name__}")
    print(f"GROQ ERROR: {e}")
    print("STATUS: FAIL")
