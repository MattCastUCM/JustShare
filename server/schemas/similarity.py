from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Annotated
from core.settings import get_settings

settings = get_settings()

NonEmptyStr = Annotated[str, Field(min_length=1)]

class BaseSimilarityRequest(BaseModel):
    query: NonEmptyStr
    language: str
    top_k: int = Field(1, ge=1)

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str):
        if value not in settings.languages:
            raise ValueError(
                f"Unsupported language '{value}'. Supported languages: {settings.languages}"
            )
        return value

class CorpusRequest(BaseModel):
    corpus: list[NonEmptyStr]

class NodeKeyRequest(BaseModel):
    node_key: NonEmptyStr

class FaissSimilarityRequest(BaseSimilarityRequest, NodeKeyRequest):
    pass

class SimilarityRequest(BaseSimilarityRequest, CorpusRequest):
    @model_validator(mode="after")
    def validate_top_k_against_corpus(self):
        if self.top_k > len(self.corpus):
            raise ValueError(
                f"top_k ({self.top_k}) cannot be greater than corpus size ({len(self.corpus)})"
            )
        return self

class HybridSimilarityRequest(BaseSimilarityRequest, CorpusRequest, NodeKeyRequest):
    @model_validator(mode="after")
    def validate_top_k_against_corpus(self):
        if self.top_k > len(self.corpus):
            raise ValueError(
                f"top_k ({self.top_k}) cannot be greater than corpus size ({len(self.corpus)})"
            )
        return self

class SimilarityMatch(BaseModel):
    index: int = Field(..., ge=0)
    score: float
    text: str

class SimilarityResponse(BaseModel):
    
    matches: list[SimilarityMatch]
    processing_time: float = Field(
        ...,
        ge=0,
        description="Time taken to process the request (seconds).",
    )
