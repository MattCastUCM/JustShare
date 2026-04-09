from gensim.models import KeyedVectors
from app.core.settings import get_settings
from app.controllers.sentence_transformers import SentenceTransformers
from app.controllers.sentence_lstm import SentenceLSTM
from loguru import logger
import spacy
import os
from typing import Callable, TypeVar, Optional, Generic
from functools import lru_cache

T = TypeVar("T")

class LazyLoader(Generic[T]):
    def __init__(self, loader: Callable[[], T], identifier: str, model_type: str):
        self._loader = loader
        self._model: Optional[T] = None
        self.identifier = identifier
        self.model_type = model_type

    @property
    def model(self) -> T:
        if self._model is None:
            logger.debug(f"Loading {self.model_type} for '{self.identifier}'...")
            try:
                self._model = self._loader()
            except Exception as e:
                logger.exception(f"Failed to load {self.model_type} for '{self.identifier}': {e}")
                raise
            logger.debug(f"Successfully loaded {self.model_type} for '{self.identifier}'.")
        return self._model

    def __repr__(self):
        status = "loaded" if self._model is not None else "not loaded"
        return f"<LazyLoader({self.model_type}, {self.identifier}, {status})>"
    
def _create_lazy_loaders(languages: set[str], source_map: dict[str, str], loader_fn: Callable[[str], T], model_type: str, validate_path: bool = False,) -> dict[str, LazyLoader]:
    loaders = {}
    for lang in languages:
        source = source_map.get(lang)
        if not source:
            logger.warning(f"No {model_type} configured for language '{lang}'.")
            continue

        if validate_path and not os.path.exists(source):
            logger.warning(f"{model_type} path does not exist for language '{lang}': {source}.")
            continue

        def make_loader(src):
            return lambda: loader_fn(src)

        loader = LazyLoader(make_loader(source), identifier=lang, model_type=model_type)
        loaders[lang] = loader

    return loaders

def get_sentence_transformers(languages: set[str]):
    settings = get_settings()
    
    return _create_lazy_loaders(
        languages=languages,
        source_map=settings.sentence_transformers,
        loader_fn=lambda model_name: SentenceTransformers(model_name),
        model_type="Sentence Transformers",
    )

def get_bert_models(languages: set[str]):
    settings = get_settings()
    
    return _create_lazy_loaders(
        languages=languages,
        source_map=settings.bert_models,
        loader_fn=lambda model_name: SentenceTransformers(model_name),
        model_type="BERT",
    )

def get_word2vec(languages: set[str]):
    settings = get_settings()

    return _create_lazy_loaders(
        languages=languages,
        source_map=settings.word2vec,
        loader_fn=lambda path: KeyedVectors.load(path, mmap="r"),
        model_type="Word2vec",
        validate_path=True
    )

def get_siamese_lstm(languages: set[str]):
    settings = get_settings()

    return _create_lazy_loaders(
        languages=languages,
        source_map=settings.siamese_lstm,
        loader_fn=lambda dir: SentenceLSTM(dir),
        model_type="Siamese LSTM",
        validate_path=True
    )

@lru_cache(maxsize=8)
def _load_spacy_model(model_name: str):
    return spacy.load(model_name, disable=["parser", "ner"])

def get_trained_pipelines(languages: set[str]):
    settings = get_settings()
    
    return _create_lazy_loaders(
        languages=languages,
        source_map=settings.spacy,
        loader_fn=lambda name: _load_spacy_model(name),
        model_type="spaCy",
    )