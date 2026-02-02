from langchain_ollama import OllamaEmbeddings
from gensim.models import KeyedVectors
from settings import get_settings
import os
from loguru import logger
import spacy
from spacy.language import Language

def get_embedding_model(model: str, temperature: float = 0.8) -> OllamaEmbeddings: 
    settings = get_settings()

    embeddings = OllamaEmbeddings(
        model=model,
        validate_model_on_init=True,
        base_url=settings.ollama_host,
        num_gpu=-1,
        temperature=temperature
    )
    return embeddings

def get_word2vec_models(languages: set[str]):
    settings = get_settings()

    word2vec_paths = settings.word2vec_paths
    word2vec_models: dict[str, KeyedVectors] = {}
    for lang in languages:
        path = word2vec_paths.get(lang)
        if path and os.path.exists(path):
           word2vec_models[lang] = KeyedVectors.load(path, mmap="r")
        else:
            logger.warning(f"No Word2Vec model found for language '{lang}'.")

    return word2vec_models

def get_trained_pipelines(languages: set[str]):
    settings = get_settings()

    spacy_paths = settings.spacy_paths
    spacy_models: dict[str, Language] = {}
    for lang in languages:
        model = spacy_paths.get(lang)
        if model:
            nlp = spacy.load(model, disable=["parser", "ner"])
            spacy_models[lang] = nlp

    return spacy_models
    