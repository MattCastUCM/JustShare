from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
	batch_size: int = 64

	mlp_dropout: float = 0.4
	lstm_dropout: float = 0.3

	pooling: str = "mean"
	similarity: str = "mlp"

	hidden_dim: int = 64
	bidirectional: bool = False
	mlp_layers: list[int] = [16]
	concat_features: list[str] = ["diff"]

	epochs: int = 20
	augmented_data: bool = False
	siamese_name: str = "siamese_lstm"

	max_len: int = 26
	augmented_max_len: int = 27

	case: bool = True
	strip_punctuation: bool = True

	model_config = SettingsConfigDict(
		env_file=".env.lstm",
		env_file_encoding="utf-8",
		case_sensitive=False,
	)
	
	@field_validator("bidirectional", "augmented_data", mode="before")
	@classmethod
	def parse_bool(cls, v):
		if isinstance(v, str):
			return v.lower() in {"true", "1", "yes"}
		return v
