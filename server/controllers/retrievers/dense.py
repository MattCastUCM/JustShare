from controllers.retrievers.retriever import Retriever
from controllers.encoders.encoder import Encoder
from services.calibrator_factory import Calibrator
from typing import Optional
import numpy as np

class DenseRetriever(Retriever):
    def __init__(self, encoder: Encoder, similarity_fn, calibrator: Optional[Calibrator] = None):
        super().__init__(encoder, calibrator)
        self.similarity_fn = similarity_fn

    def _fit(self, corpus: list[str]):
        self.corpus = corpus
        self.encoder.fit(corpus)
        self.embeddings = self.encoder.transform(corpus)
        return self

    def _search(self, query: str, top_k: int):
        query_vec = self.encoder.transform([query])[0]

        scores = self.similarity_fn(self.embeddings, query_vec)

        top_idx = np.argsort(scores)[::-1][:top_k]

        return (
            top_idx,
            scores[top_idx],
            np.array([self.corpus[i] for i in top_idx], dtype=object)
        )
