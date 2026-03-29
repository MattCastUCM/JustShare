from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache

class Settings(BaseSettings):
	EMBED_DIM: int = 400
	HIDDEN_DIM: int = 64
	BATCH_SIZE: int = 64
	MLP_DROPOUT: float = 0.4
	LSTM_DROPOUT: float = 0.3
	POOLING: str = "mean"
	SIMILARITY: str = "mlp"
	MLP_LAYERS: list[int] = [64]
	BIDIRECTIONAL: bool = False
	CONCAT_FEATURES: list[str] = ["diff"]
	EPOCHS: int = 20
	SIAMESE_DIR: str = "siamese_lstm"

	model_config = SettingsConfigDict(
		env_file=".env.model",
		env_file_encoding="utf-8",
		case_sensitive=False,
	)
	
	@field_validator("BIDIRECTIONAL", mode="before")
	def parse_bool(cls, v):
		if isinstance(v, str):
			return v.lower() in ("true", "1", "yes")
		return v

@lru_cache
def get_settings():
    return Settings()

