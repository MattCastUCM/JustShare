from abc import ABC, abstractmethod
from schemas.similarity import SimilarityMatch

class BaseRetriever(ABC):
    @abstractmethod
    def fit(self, corpus: list[str], language: str):
        pass

    @abstractmethod
    def search(self, query: str, top_k: int=3) -> list[SimilarityMatch]:
        pass