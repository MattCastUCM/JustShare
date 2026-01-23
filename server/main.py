from langchain_ollama import OllamaEmbeddings
from langchain_core.embeddings import Embeddings
from preprocessing import TextPreprocessor

def get_embedding_model(model: str, temperature: float = 0.8) -> Embeddings: 
    embeddings = OllamaEmbeddings(
        model=model,
        validate_model_on_init=True,
        num_gpu=-1,
        temperature=temperature
    )
    return embeddings

def main():
    # embedddings = get_embedding_model("qwen3-embedding:4b")
    corpus = [
        "Igualmente, encantado de conocerte *sonríes*.",
        "Gracias, si necesito algo ya te iré diciendo.",
        "... Ah, sí, hola."
    ]
    text_preprocessor = TextPreprocessor(2, "spanish")
    normalized_text = text_preprocessor.preprocess_with_ngrams("¡¡¡¡Hola, te quiero mucho, eres muy guapa, favoríto!")
    print(normalized_text)
    return

if __name__ == "__main__":
    main()
