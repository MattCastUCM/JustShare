from pydantic_settings import BaseSettings, SettingsConfigDict
from schemas.similarity import SearchMethod
from pydantic import Field
from functools import lru_cache
import os

class Settings(BaseSettings):
    languages: set[str] = Field(default_factory=set)

    spacy: dict[str, str] = Field(default_factory=dict)
    sbert: dict[str, str] = Field(default_factory=dict)
    word2vec: dict[str, str] = Field(default_factory=dict)
    siamese_lstm: dict[str, str] = Field(default_factory=dict)

    models: list[SearchMethod] = Field(default_factory=list)

    allow_origins: list[str] = Field(default_factory=list)

    host: str = "0.0.0.0"
    port: int = 8000

    spell_max_distance: int = 2

    spell_unigram_weight: float = 0.8

    spell_data_dir: str = "./spelling_checker/data"

    @property
    def hunspell_dict_dir(self) -> str:
        return os.path.join(
            self.spell_data_dir,
            "hunspell",
            "es_ES",
        )

    spell_model_dir: str = "./spelling_checker/models"

    @property
    def bk_tree_path(self):
        return os.path.join(
            self.spell_model_dir,
            f"distance_{self.spell_max_distance}",
            "bk_tree.pkl",
        )

    @property
    def sym_spell_path(self):
        return os.path.join(
            self.spell_model_dir,
            f"distance_{self.spell_max_distance}",
            "sym_spell.pkl",
        )

    @property
    def forward_lm_path(self):
        return os.path.join(
            self.spell_model_dir,
            f"distance_{self.spell_max_distance}",
            "forward_lm.pkl",
        )

    @property
    def backward_lm_path(self):
        return os.path.join(
            self.spell_model_dir,
            f"distance_{self.spell_max_distance}",
            "backward_lm.pkl",
        )

    faiss_data_dir: str = "./faiss_data"

    adaptation_data_dir: str = "./adaptation/data"

    @property
    def name_whitelist_path(self) -> str:
        return os.path.join(
            self.adaptation_data_dir,
            "name_whitelist.txt",
        )

    @property
    def spanish_names_path(self) -> str:
        return os.path.join(
            self.adaptation_data_dir,
            "nombres-propios-es.txt",
        )

    localization_dir: str = "./adaptation/localization"

    @property
    def structure_dir(self) -> str:
        return os.path.join(
            self.localization_dir,
            "structure",
            "modified",
        )

    @property
    def language_dir(self) -> str:
        return os.path.join(
            self.localization_dir,
            "dialogue",
            "active",
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

@lru_cache
def get_settings():
    return Settings()
