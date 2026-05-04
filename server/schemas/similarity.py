from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Annotated
from enum import StrEnum
from core.settings import get_settings
from math import isclose

settings = get_settings()

class SearchMethod(StrEnum):
    WORD2VEC = "word2vec"
    TFIDF = "tfidf"
    JACCARD = "jaccard"
    LSTM = "lstm"
    BERT = "bert"
    SBERT = "sbert"

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

class HybridSimilarityRequest(BaseSimilarityRequest, CorpusRequest, NodeKeyRequest):
    methods: list[SearchMethod] = Field(..., min_length=2)
    weights: list[float] = Field(..., min_length=2)

    @model_validator(mode="after")
    def validate_top_k_against_corpus(self):
        if self.top_k > len(self.corpus):
            raise ValueError(
                f"top_k ({self.top_k}) cannot be greater than corpus size ({len(self.corpus)})"
            )

        if len(self.methods) != len(self.weights):
            raise ValueError(
                f"'methods' and 'weights' must have the same length "
                f"(got {len(self.methods)} and {len(self.weights)})"
            )

        if not isclose(sum(self.weights), 1.0, rel_tol=1e-6, abs_tol=1e-8):
            raise ValueError(
                f"'weights' must sum to 1.0 (got {sum(self.weights)})"
            )

        return self

class SimilarityRequest(BaseSimilarityRequest, CorpusRequest):
    @model_validator(mode="after")
    def validate_top_k_against_corpus(self):
        if self.top_k > len(self.corpus):
            raise ValueError(
                f"top_k ({self.top_k}) cannot be greater than corpus size ({len(self.corpus)})"
            )
        return self
    
class SimilarityScore(BaseModel):
    value: float
    weight: float = 1.0

class SimilarityMatch(BaseModel):
    index: int = Field(..., ge=0)
    scores: dict[str, SimilarityScore]
    text: str

class SimilarityResponse(BaseModel):
    matches: list[SimilarityMatch]
    processing_time: float = Field(
        ...,
        ge=0,
        description="Time taken to process the request (seconds).",
    )
