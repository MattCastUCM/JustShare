from pydantic import BaseModel, Field, field_validator
from typing import Literal
from ..core.settings import get_settings

SimilarityMethod = Literal["jaccard", "tfidf", "sentence_transformers", "bert", "word2vec", "siamese_lstm"]

class SimilarityRequest(BaseModel):
    corpus: list[str] = Field(..., min_length=1)
    text: str = Field(..., min_length=1)
    method: SimilarityMethod
    language: str
    top_k: int = Field(1, ge=1)

    @field_validator("corpus")
    @classmethod
    def validate_corpus_content(cls, corpus: list[str]) -> list[str]:
        if any(not doc.strip() for doc in corpus):
            raise ValueError("Corpus contains empty documents.")
        return corpus

    @field_validator("language", mode="after")
    @classmethod
    def validate_language(cls, value: str) -> str:
        settings = get_settings()
        if value not in settings.languages:
            raise ValueError(f"Unsupported language '{value}'. Supported languages: {settings.languages}")
        return value

class SimilarityMatch(BaseModel):
    index: int
    score: float
    text: str

class SimilarityResponse(BaseModel):
    method: SimilarityMethod
    matches: list[SimilarityMatch]
    processing_time: float = Field(..., description="Time taken to process the request, in seconds.")
    corpus_size: int