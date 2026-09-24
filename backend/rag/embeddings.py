"""
embeddings.py — Creates text embeddings using Sentence Transformers.

Uses the 'all-MiniLM-L6-v2' model which is:
  - Fast (small model, runs on CPU fine)
  - Good quality for semantic similarity
  - 384-dimensional embeddings

IMPORTANT: The SAME model is used for both document embedding and
query embedding. This is essential — if you use different models,
the vector similarity search will return garbage results.
"""

from sentence_transformers import SentenceTransformer

# ------------------------------------------------------------------
# Singleton: load the model once and reuse it.
# Loading a transformer model takes a few seconds, so we don't want
# to reload it every time someone asks a question.
# ------------------------------------------------------------------
_model = None
MODEL_NAME = "all-MiniLM-L6-v2"


def _get_model():
    """Load the embedding model (only once)."""
    global _model
    if _model is None:
        print(f"Loading embedding model: {MODEL_NAME} ...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Embedding model loaded.")
    return _model


def embed_texts(texts):
    """
    Convert a list of text strings into embeddings (list of float lists).

    Args:
        texts: List of strings, e.g. ["Hello world", "Birthday package"]

    Returns:
        List of lists of floats, e.g. [[0.1, -0.3, ...], [0.5, 0.2, ...]]
        Each inner list has 384 numbers (the embedding dimensions).
    """
    model = _get_model()
    embeddings = model.encode(texts, show_progress_bar=False)
    # Convert numpy arrays to plain Python lists for ChromaDB compatibility
    return embeddings.tolist()


def embed_query(query):
    """
    Convert a single user question into an embedding.

    Uses the SAME model as embed_texts — this is critical for
    the vector similarity search to work correctly.

    Args:
        query: A single string, e.g. "What is the birthday price?"

    Returns:
        A list of 384 floats representing the query embedding.
    """
    model = _get_model()
    embedding = model.encode([query], show_progress_bar=False)
    return embedding.tolist()[0]


# ------------------------------------------------------------------
# Quick self-test
# ------------------------------------------------------------------
if __name__ == "__main__":
    test_texts = ["Birthday decoration package", "Marriage decoration"]
    results = embed_texts(test_texts)
    print(f"Embedded {len(results)} texts")
    print(f"Embedding dimension: {len(results[0])}")

    q = embed_query("How much does birthday cost?")
    print(f"Query embedding dimension: {len(q)}")
