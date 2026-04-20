from controllers.retriever import BaseRetriever
from schemas.similarity import SimilarityMatch
import numpy as np

class JaccardRetriever(BaseRetriever):
    def __init__(self, preprocessor_fn):
        self.preprocess = preprocessor_fn

    def _jaccard(self, a: set, b: set):
        if not a and not b:
            return 0.0
        return len(a & b) / len(a | b)

    def fit(self, corpus: list[str], language: str):
        self.corpus = corpus
        self.language = language

        self.corpus_tokens = [
            set(self.preprocess(doc, language))
            for doc in corpus
        ]

        return self

    def search(self, query: str, top_k: int=3):
        if self.corpus_tokens is None:
            raise ValueError("Retriever not fitted. Call 'fit' first.")
        
        query_tokens = set(self.preprocess(query, self.language))

        scores = np.array([
            self._jaccard(query_tokens, doc_tokens)
            for doc_tokens in self.corpus_tokens
        ])

        top_indices = np.argsort(scores)[::-1][:top_k]

        return [
			SimilarityMatch(
				index=int(i),
				score=float(scores[i]),
				text=self.corpus[i],
			)
			for i in top_indices
		]
