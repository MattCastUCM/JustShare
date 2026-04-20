from pydantic import BaseModel, Field, field_validator, model_validator
from core.settings import get_settings

settings = get_settings()

class BaseSimilarityRequest(BaseModel):
    query: str = Field(..., min_length=1)
    language: str
    top_k: int = Field(1, ge=1)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Query cannot be empty or whitespace.")
        return value

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str):
        if value not in settings.languages:
            raise ValueError(
                f"Unsupported language '{value}'. Supported languages: {settings.languages}"
            )
        return value

class DenseSimilarityRequest(BaseSimilarityRequest):
    node_key: str = Field(..., min_length=1)

    @field_validator("node_key")
    @classmethod
    def validate_node_key(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("node_key cannot be empty.")
        return value

class SimilarityRequest(BaseSimilarityRequest):
    corpus: list[str] = Field(..., min_length=1)

    @field_validator("corpus")
    @classmethod
    def validate_corpus_content(cls, corpus: list[str]) -> list[str]:
        if any(not doc.strip() for doc in corpus):
            raise ValueError("Corpus contains empty documents.")
        return corpus

    @model_validator(mode="after")
    def validate_top_k(self):
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
