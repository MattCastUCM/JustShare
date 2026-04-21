from abc import ABC, abstractmethod

class BaseRetriever(ABC):
    @abstractmethod
    def fit(self, corpus: list[str], language: str):
        pass

    @abstractmethod
    def search(self, query: str, top_k: int=3):
        pass