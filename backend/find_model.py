from dotenv import load_dotenv
import os
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

models_to_test = [
    "compound-beta",
    "compound-beta-mini",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "allam-2-7b",
]

for m in models_to_test:
    try:
        r = client.chat.completions.create(model=m, messages=[{"role":"user","content":"What is 2+2? Reply with just the number."}], max_tokens=10)
        print(f"OK: {m} -> {r.choices[0].message.content.strip()[:50]}")
    except Exception as e:
        print(f"FAIL: {m} -> {type(e).__name__}: {str(e)[:100]}")
