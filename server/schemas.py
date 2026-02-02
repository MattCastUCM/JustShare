from pydantic import BaseModel, Field, field_validator
from typing import Literal
from settings import get_settings

class SimilarityRequest(BaseModel):
    corpus: list[str] = Field(..., min_length=1)
    text: str
    method: Literal["jaccard", "tfidf", "embeddings", "word2vec"]
    language: str

    @field_validator("language", mode="after")
    @classmethod
    def validate_language(cls, value: str) -> str:
        settings = get_settings()
        if value not in settings.languages:
            raise ValueError(f"Unsupported language '{value}'. Supported languages: {settings.languages}")
        return value

class SimilarityResponse(BaseModel):
    index: int
    score: float
    text: str