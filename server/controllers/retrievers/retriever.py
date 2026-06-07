from abc import ABC, abstractmethod
from controllers.encoders.encoder import Encoder
from typing import Optional
from services.calibrator_factory import Calibrator
import numpy as np

class Retriever(ABC):
    def __init__(self, encoder: Encoder, calibrator: Optional[Calibrator] = None):
        self.encoder = encoder
        self.calibrator = calibrator
        self.fitted = False

    def search(self, query: str, top_k: int = 3, replacement_token = "[UNK]") -> tuple[np.ndarray, np.ndarray, np.ndarray]:
        if not self.fitted:
            raise ValueError(f"{self.__class__.__name__} is not fitted.")

        # Aplicar expresiones regulares para tratar de enmascarar nombres propios de personas
        # processed_query = apply_name_patterns(query, replacement_token)
        # print(processed_query)

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
