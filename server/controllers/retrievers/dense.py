from controllers.retrievers.retriever import Retriever
from controllers.encoders.encoder import Encoder
from services.calibrator_factory import Calibrator
from typing import Optional
from adaptation.misc import NameAnonymizer
from spelling_checker.corrections import SpellCorrector
import numpy as np

class DenseRetriever(Retriever):
    def __init__(self, encoder: Encoder, similarity_fn, name_anonymizer: Optional[NameAnonymizer] = None, spell_corrector: Optional[SpellCorrector] = None, calibrator: Optional[Calibrator] = None):
        super().__init__(encoder, name_anonymizer, spell_corrector, calibrator)
        self.similarity_fn = similarity_fn

    def _fit(self, corpus: list[str]):
        self.corpus = corpus
        self.encoder.fit(corpus)
        self.embeddings = self.encoder.transform(corpus)
        return self

    def _search(self, query: str, top_k: int):
        query_vec = self.encoder.transform([query])[0]

        scores = self.similarity_fn(self.embeddings, query_vec)
        scores = scores.flatten()

        top_idx = np.argsort(scores)[::-1][:top_k]

        return (
            top_idx,
            scores[top_idx],
            np.array([self.corpus[i] for i in top_idx], dtype=object)
        )
