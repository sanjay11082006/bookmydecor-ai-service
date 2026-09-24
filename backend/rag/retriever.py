"""
retriever.py — Retrieves the most relevant PR Decorations knowledge chunks.

Takes a user question, converts it to an embedding, and queries ChromaDB
to find the most semantically similar knowledge-base chunks.

Key anti-hallucination feature:
  - Uses a DISTANCE THRESHOLD to filter out low-relevance results.
  - If the retriever finds nothing relevant (e.g. user asks about
    "LED wall decoration" which doesn't exist in the knowledge base),
    it returns an empty list — so the LLM has NO context to hallucinate from.
"""

from rag.embeddings import embed_query
from rag.vectorstore import get_collection

# ------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------
TOP_K = 5                     # Number of chunks to retrieve
MAX_DISTANCE = 1.2            # Cosine distance threshold (0 = perfect match, 2 = opposite)
                               # 1.2 is moderately strict — filters out clearly irrelevant chunks


def retrieve(question, top_k=TOP_K, max_distance=MAX_DISTANCE):
    """
    Retrieve the most relevant knowledge-base chunks for a user question.

    Args:
        question:     The user's question string
        top_k:        How many results to return (default 5)
        max_distance: Maximum cosine distance to accept (default 1.2)

    Returns:
        A list of dictionaries, each containing:
            {
                "text":     "the chunk content",
                "source":   "birthday.txt",
                "category": "02_services",
                "distance": 0.45   (lower = more relevant)
            }

        Returns an EMPTY LIST if:
          - The vector store doesn't exist
          - No chunks are relevant enough (all above max_distance)
    """
    collection = get_collection()

    if collection is None:
        print("Vector store not found. Run build_vectorstore() first.")
        return []

    if collection.count() == 0:
        print("Vector store is empty. No documents to search.")
        return []

    # Embed the user's question using the SAME model as the documents
    query_embedding = embed_query(question)

    # Query ChromaDB for the most similar chunks
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )

    # Unpack ChromaDB results (they come as lists-of-lists)
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]

    # Filter by distance threshold to reduce hallucination risk
    retrieved = []
    for text, meta, dist in zip(documents, metadatas, distances):
        if dist <= max_distance:
            retrieved.append(
                {
                    "text": text,
                    "source": meta.get("source", "unknown"),
                    "category": meta.get("category", "unknown"),
                    "distance": round(dist, 4),
                }
            )

    if not retrieved:
        print(
            f"No relevant chunks found for: '{question}' "
            f"(closest distance: {distances[0]:.4f}, threshold: {max_distance})"
        )
    else:
        print(
            f"Retrieved {len(retrieved)} chunks for: '{question}' "
            f"(best distance: {retrieved[0]['distance']})"
        )

    return retrieved


def format_context(chunks):
    """
    Format retrieved chunks into a single context string for the LLM prompt.

    Each chunk is labeled with its source file so the LLM knows where
    the information came from.
    """
    if not chunks:
        return "No relevant information was found in the PR Decorations knowledge base."

    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(
            f"[Source: {chunk['source']} | Category: {chunk['category']}]\n"
            f"{chunk['text']}"
        )

    return "\n\n---\n\n".join(context_parts)


# ------------------------------------------------------------------
# Quick self-test:  python -m rag.retriever
# ------------------------------------------------------------------
if __name__ == "__main__":
    test_questions = [
        "What is the starting price for birthday decoration?",
        "How much advance payment is required?",
        "Do you provide LED wall decoration?",
        "What payment methods do you accept?",
    ]

    for q in test_questions:
        print(f"\n{'='*60}")
        print(f"QUESTION: {q}")
        print("=" * 60)
        chunks = retrieve(q)
        if chunks:
            for c in chunks:
                print(f"  [{c['distance']}] {c['source']}: {c['text'][:100]}...")
        else:
            print("  → No relevant chunks found (fallback to 'I don't know')")