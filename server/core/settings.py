from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache
from enum import StrEnum

class ModelType(StrEnum):
    SPACY = "spacy"
    SBERT = "sbert"
    WORD2VEC = "word2vec"
    SIAMESE_LSTM = "siamese_lstm"

class Settings(BaseSettings):
    languages: set[str] = Field(default_factory=set)

    spacy: dict[str, str] = Field(default_factory=dict)
    sbert: dict[str, str] = Field(default_factory=dict)
    word2vec: dict[str, str] = Field(default_factory=dict)
    siamese_lstm: dict[str, str] = Field(default_factory=dict)

    models: list[ModelType] = Field(
        default_factory=lambda: [ModelType.SPACY, ModelType.SBERT]
    )

    allow_origins: list[str] = Field(default_factory=list)

    host: str = "0.0.0.0"
    port: int = 8000

    faiss_data_dir: str = "./faiss_data"
    adaptation_data_dir: str = "./adaptation/data"
    localization_dir: str = "./adaptation/localization"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()
