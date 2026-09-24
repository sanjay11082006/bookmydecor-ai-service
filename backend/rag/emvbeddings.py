from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


# Load embedding model
_model = SentenceTransformer(MODEL_NAME)


def create_embeddings(texts):
    """
    Convert a list of texts into vector embeddings.
    """

    embeddings = _model.encode(
        texts,
        show_progress_bar=True,
        normalize_embeddings=True
    )

    return embeddings.tolist()


def create_single_embedding(text):
    """
    Convert one text into a vector embedding.
    """

    embedding = _model.encode(
        text,
        normalize_embeddings=True
    )

    return embedding.tolist()