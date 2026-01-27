from langchain_ollama import OllamaEmbeddings
import hashlib
import os

def get_embedding_model(model: str, temperature: float = 0.8) -> OllamaEmbeddings: 
    embeddings = OllamaEmbeddings(
        model=model,
        validate_model_on_init=True,
        base_url=os.getenv("OLLAMA_HOST"),
        num_gpu=-1,
        temperature=temperature
    )
    return embeddings

def generate_corpus_id(corpus: list[str]):
    joined = "\n".join(corpus).encode("utf-8")
    return hashlib.sha256(joined).hexdigest()