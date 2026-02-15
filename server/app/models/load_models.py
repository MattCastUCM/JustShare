from gensim.models import KeyedVectors
from ..core.settings import get_settings
from .sentence_embeddings import SentenceEmbeddings
from loguru import logger
import spacy
import os
from typing import Callable, TypeVar

T = TypeVar("T")

def _load_per_language(languages: set[str], source_map: dict[str, str], loader: Callable[[str], T], model_type: str, validate_path: bool = False) -> dict[str, T]:
    models: dict[str, T] = {}

    for lang in languages:
        value = source_map.get(lang)

        if not value:
            logger.warning(f"No {model_type} configured for language '{lang}'.")
        else:
            if validate_path and not os.path.exists(value):
                logger.warning(f"{model_type} path does not exist for language '{lang}': {value}.")
            else:
                try:
                    models[lang] = loader(value)
                except Exception as e:
                    logger.exception(
                        f"Failed to load {model_type} for language '{lang}': {e}."
                    )

    return models

def get_sentence_transformers(languages: set[str]):
    settings = get_settings()
    
    return _load_per_language(
        languages=languages,
        source_map=settings.sentence_transformers,
        loader=lambda model_name: SentenceEmbeddings(model_name=model_name),
        model_type="Sentence Transformers model",
    )

def get_bert_models(languages: set[str]):
    settings = get_settings()
    
    return _load_per_language(
        languages=languages,
        source_map=settings.bert_models,
        loader=lambda model_name: SentenceEmbeddings(model_name=model_name),
        model_type="Bert model",
    )

def get_word2vec(languages: set[str]):
    settings = get_settings()

    return _load_per_language(
        languages=languages,
        source_map=settings.word2vec,
        loader=lambda path: KeyedVectors.load(path, mmap="r"),
        model_type="Word2vec model",
        validate_path=True
    )

def get_trained_pipelines(languages: set[str]):
    settings = get_settings()

    return _load_per_language(
        languages=languages,
        source_map=settings.spacy,
        loader=lambda model: spacy.load(model, disable=["parser", "ner"]),
        model_type="spaCy model",
    )
    