from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    ollama_host: str = ""
    languages: set[str] = Field(default_factory=set)
    embedding_model: str = "qwen3-embedding:4b"
    word2vec_paths: dict[str, str] = Field(default_factory=dict)
    spacy_paths: dict[str, str] = Field(default_factory=dict)

    model_config = SettingsConfigDict(
        # env_prefix="APP_"
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

@lru_cache
def get_settings():
    return Settings()