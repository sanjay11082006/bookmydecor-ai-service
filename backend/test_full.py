"""Full chatbot test — known + unknown questions via the live API."""
import json
import urllib.request

API = "http://127.0.0.1:8000/ask"

tests = [
    ("Marriage package", True),
    ("Birthday decoration budget", True),
    ("What is the advance payment?", True),
    ("How much does home decoration start from?", True),
    ("Do you provide photography?", False),
    ("Do you offer discounts?", None),  # may or may not be in KB
    ("What payment methods do you accept?", None),
]

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

for q, expected_known in tests:
    data = json.dumps({"question": q}).encode()
    req = urllib.request.Request(API, data=data, headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req, timeout=30).read())
    answer = resp["answer"][:120]
    is_unknown = "I don't know" in resp["answer"]
    tag = "UNKNOWN" if is_unknown else "ANSWERED"
    print(f"[{tag}] Q: {q}")
    print(f"         A: {answer}...")
    print()
