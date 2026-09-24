"""
loader.py — Loads PR Decorations knowledge base text files into chunks.

Walks through data/rag_knowledge/PR_Decorations_RAG/ recursively,
reads all .txt files (skipping README.txt files), and splits them
into meaningful chunks using double-newline paragraph breaks.

Each chunk gets metadata so we know which file and category it came from.
"""

from pathlib import Path


# ------------------------------------------------------------------
# Path to the PR Decorations knowledge base
# ------------------------------------------------------------------
# This file lives at: backend/rag/loader.py
# Knowledge base is at: data/rag_knowledge/PR_Decorations_RAG/
# So we go up 2 levels (rag → backend → project root)
DATA_DIR = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "rag_knowledge"
    / "PR_Decorations_RAG"
)


def load_documents():
    """
    Load all useful TXT files from the PR Decorations knowledge base
    and split them into chunks ready for embedding.

    Each chunk is a dictionary:
        {
            "text":     "the chunk content",
            "source":   "02_services/birthday.txt",
            "category": "02_services",
            "chunk_id": "02_services/birthday.txt_chunk_0"
        }

    README.txt files are skipped because they contain instructions
    for the developer, not actual business data.
    """
    if not DATA_DIR.exists():
        raise FileNotFoundError(
            f"Knowledge base not found at: {DATA_DIR}"
        )

    chunks = []

    for file_path in sorted(DATA_DIR.rglob("*.txt")):

        # Ignore README files — developer notes, not business data
        if file_path.name.lower() == "readme.txt":
            continue

        text = file_path.read_text(encoding="utf-8").strip()

        if not text:
            continue

        relative_path = file_path.relative_to(DATA_DIR)

        # e.g. "02_services/birthday.txt"
        source = str(relative_path).replace("\\", "/")

        # e.g. "02_services"
        category = (
            relative_path.parts[0]
            if len(relative_path.parts) > 1
            else "general"
        )

        # Split into chunks on double-newline boundaries.
        # This respects the natural section breaks in the .txt files
        # (e.g. SERVICE:, STARTING PRICE:, BASIC PACKAGE INCLUDES:).
        paragraphs = text.split("\n\n")

        current_chunk = ""
        chunk_idx = 0

        for paragraph in paragraphs:
            paragraph = paragraph.strip()

            if not paragraph:
                continue

            # Group paragraphs into chunks up to ~1200 chars
            if len(current_chunk) + len(paragraph) <= 1200:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
            else:
                # Save current chunk if it has useful content
                if current_chunk and len(current_chunk) >= 20:
                    chunks.append({
                        "text": current_chunk,
                        "source": source,
                        "category": category,
                        "chunk_id": f"{source}_chunk_{chunk_idx}",
                    })
                    chunk_idx += 1
                current_chunk = paragraph

        # Save the last chunk
        if current_chunk and len(current_chunk) >= 20:
            chunks.append({
                "text": current_chunk,
                "source": source,
                "category": category,
                "chunk_id": f"{source}_chunk_{chunk_idx}",
            })

    if not chunks:
        raise ValueError(
            "No document chunks were loaded from the knowledge base. "
            f"Check that .txt files exist in:\n  {DATA_DIR}"
        )

    try:
        print(f"Loaded {len(chunks)} chunks from {DATA_DIR}")
    except Exception:
        pass
    return chunks


# ------------------------------------------------------------------
# Quick self-test: run this file directly to verify loading works.
#   cd backend
#   python -m rag.loader
# ------------------------------------------------------------------
if __name__ == "__main__":
    docs = load_documents()
    print(f"\nTotal chunks: {len(docs)}\n")
    for doc in docs[:5]:
        print(f"--- {doc['chunk_id']} ---")
        print(doc["text"][:200])
        print()