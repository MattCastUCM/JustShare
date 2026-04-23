from abc import ABC, abstractmethod
from controllers.encoders.encoder import Encoder

class Retriever(ABC):
    def __init__(self, encoder: Encoder, calibrator=None):
        self.encoder = encoder
        self.calibrator = calibrator
        self.fitted = False

    def search(self, query: str, top_k: int = 3):
        if not self.fitted:
            raise ValueError(f"{self.__class__.__name__} is not fitted.")

        idx, scores, texts = self._search(query, top_k)
        scores = self._postprocess_scores(scores)
        return idx, scores, texts
    
    def fit(self, corpus: list[str]):
        self._fit(corpus)
        self._fitted = True
        return self
    
    def _postprocess_scores(self, scores):
        if self.calibrator:
            return self.calibrator(scores)
        return scores
    
    def is_fitted(self):
        return self.fitted
    
    @abstractmethod
    def _fit(self, corpus: list[str]):
        raise NotImplementedError

    @abstractmethod
    def _search(self, query: str, top_k: int):
        raise NotImplementedError
