"""
test_rag_pipeline.py — Tests the full RAG + LLM pipeline
"""
import sys
import os

# Add backend to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.loader import load_documents
from rag.vectorstore import build_vectorstore
from chatbot import get_response

def run_tests():
    print("="*60)
    print("TESTING RAG + GROQ LLM PIPELINE")
    print("="*60)
    
    # Optional: rebuild vectorstore if testing from scratch
    # build_vectorstore()

    questions = [
        "How much does birthday decoration cost?",
        "Birthday decoration budget?",
        "How much advance is required?",
        "How much does marriage decoration cost?",
        "What payment methods do you accept?"
    ]

    for q in questions:
        print(f"\nQ: {q}")
        print("-" * 60)
        
        result = get_response(q)
        print(f"ANSWER:\n{result['answer']}")
        print(f"\nSOURCES USED: {len(result['chunks'])}")
        for c in result['chunks']:
            print(f" - {c['source']}")

if __name__ == "__main__":
    run_tests()
