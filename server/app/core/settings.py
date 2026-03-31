from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    languages: set[str] = Field(default_factory=set)

    bert_models: dict[str, str] = Field(default_factory=dict)
    sentence_transformers: dict[str, str] = Field(default_factory=dict)
    word2vec: dict[str, str] = Field(default_factory=dict)
    spacy: dict[str, str] = Field(default_factory=dict)
    siamese_lstm: dict[str, str] = Field(default_factory=dict)

    allow_origins: list[str] = Field(default_factory=list)
    host: str = ""
    port: int = 0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

@lru_cache
def get_settings():
    return Settings()