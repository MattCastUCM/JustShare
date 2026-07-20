from abc import ABC, abstractmethod
from controllers.encoders.encoder import Encoder
from typing import Optional
from services.calibrator_factory import Calibrator
import numpy as np
from adaptation.misc import NameAnonymizer
from spelling_checker.corrections import SpellCorrector
from core.settings import get_settings
from typing import Optional

class Retriever(ABC):
    def __init__(self, encoder: Encoder, name_anonymizer: Optional[NameAnonymizer] = None, spell_corrector: Optional[SpellCorrector] = None, calibrator: Optional[Calibrator] = None):
        self.encoder = encoder
        self.spell_corrector = spell_corrector
        self.calibrator = calibrator
        self.fitted = False
        self.name_anonymizer = name_anonymizer
        self.settings = get_settings()

    def search(self, query: str, top_k: int = 3) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        if not self.fitted:
            raise ValueError(f"{self.__class__.__name__} is not fitted.")

        # Enmascarar nombres propios de personas
        if self.name_anonymizer:
            query = self.name_anonymizer.apply_name_patterns(query)

        # Corregir oración
        if self.spell_corrector:
            query = self.spell_corrector.correct_text(
                query,
                unigram_weight=self.settings.spell_unigram_weight
            )

        idx, scores, texts = self._search(query, top_k)

        scores = self._postprocess_scores(scores)
        return idx, scores, texts
    
    def fit(self, corpus: list[str]):
        self._fit(corpus)
        self.fitted = True
        return self
    
    def _postprocess_scores(self, scores: np.ndarray):
        if self.calibrator:
            scores = self.calibrator(scores)
        return scores
    
    def is_fitted(self):
        return self.fitted
    
    @abstractmethod
    def _fit(self, corpus: list[str]):
        raise NotImplementedError

    @abstractmethod
    def _search(self, query: str, top_k: int):
        raise NotImplementedError
