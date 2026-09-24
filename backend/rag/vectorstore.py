"""
vectorstore.py — Creates and manages the ChromaDB vector database.

Stores the PR Decorations knowledge-base chunks as embeddings in a
persistent ChromaDB collection.  The database is saved to disk at
backend/chroma_db/ so it doesn't need to be rebuilt every time.

Key design decisions:
  - Uses a SINGLE collection called "pr_decorations"
  - Each document has an ID, text, embedding, and metadata
  - The build_vectorstore() function deletes and recreates the
    collection from scratch — call this when the knowledge base changes
"""

from pathlib import Path
import chromadb

from rag.loader import load_documents
from rag.embeddings import embed_texts

# ------------------------------------------------------------------
# ChromaDB storage location (persisted to disk)
# ------------------------------------------------------------------
# This file lives at: backend/rag/vectorstore.py
# We want chroma_db at: backend/chroma_db/
CHROMA_DB_DIR = str(
    Path(__file__).resolve().parent.parent / "chroma_db"
)

COLLECTION_NAME = "pr_decorations"


def _get_client():
    """Create a persistent ChromaDB client that saves to disk."""
    return chromadb.PersistentClient(path=CHROMA_DB_DIR)


def build_vectorstore():
    """
    Build (or rebuild) the vector database from the knowledge base.

    Steps:
      1. Load all document chunks from the knowledge base .txt files
      2. Embed all chunk texts using Sentence Transformers
      3. Delete any existing ChromaDB collection (clean rebuild)
      4. Create a new collection and add all documents

    Call this when:
      - Running the chatbot for the first time
      - After updating the knowledge base files
    """
    # Step 1: Load documents
    documents = load_documents()

    # Step 2: Create embeddings for all chunks
    texts = [doc["text"] for doc in documents]
    print(f"Embedding {len(texts)} chunks ...")
    embeddings = embed_texts(texts)
    print("Embeddings created.")

    # Step 3: Set up ChromaDB
    client = _get_client()

    # Delete old collection if it exists (clean rebuild)
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"Deleted old '{COLLECTION_NAME}' collection.")
    except Exception:
        pass  # Collection didn't exist yet — that's fine

    # Step 4: Create collection and add all documents
    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},  # Use cosine similarity
    )

    # Prepare data for ChromaDB
    ids = [doc["chunk_id"] for doc in documents]
    metadatas = [
        {"source": doc["source"], "category": doc["category"]}
        for doc in documents
    ]

    collection.add(
        ids=ids,
        documents=texts,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    print(
        f"Vector store built: {collection.count()} documents "
        f"in '{COLLECTION_NAME}' collection."
    )
    print(f"Persisted at: {CHROMA_DB_DIR}")
    return collection


def get_collection():
    """
    Get the existing ChromaDB collection.

    Returns None if the collection doesn't exist yet
    (meaning build_vectorstore() hasn't been run).
    """
    client = _get_client()
    try:
        collection = client.get_collection(
            name=COLLECTION_NAME,
        )
        return collection
    except Exception:
        return None


# ------------------------------------------------------------------
# Quick self-test:  python -m rag.vectorstore
# ------------------------------------------------------------------
if __name__ == "__main__":
    collection = build_vectorstore()
    print(f"\nCollection has {collection.count()} documents.")

    # Verify we can retrieve it
    loaded = get_collection()
    if loaded:
        print(f"✅ Successfully loaded collection with {loaded.count()} docs.")
    else:
        print("❌ Could not load collection!")