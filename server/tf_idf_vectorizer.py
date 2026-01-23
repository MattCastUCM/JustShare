from collections import Counter
import math
import numpy as np
from math_utils import euclidean_normalization

class TfIdfVectorizer:
    vocab: dict[str, int]
    idf: dict[str, float]
    fitted: bool

    def __init__(self):
        self.vocab = {}
        self.idf = {}
        self.fitted = False

    def _calculate_term_frequency(self, doc: list[str]):
        doc_len = len(doc)
        counts = Counter(doc)

        tf = {term: count / doc_len for term, count in counts.items()}
        return tf
    
    def _calculate_document_frequency(self, docs: list[list[str]]):
        df = Counter()

        for doc in docs:
            unique_term = set(doc)
            df.update(unique_term)

        return df
    
    def _calculate_inverse_document_frequency(self, df: dict[str, int], n_docs: int):
        idf = {}
        for term, doc_freq in df.items():
            idf[term] = math.log((n_docs + 1) / (doc_freq + 1) + 1)
        return idf

    def fit(self, corpus: list[list[str]]):
        n_docs = len(corpus)
        df = self._calculate_document_frequency(corpus)

        self.idf = self._calculate_inverse_document_frequency(df, n_docs)

        terms = sorted(df.keys())
        self.vocab = {term: i for i, term in enumerate(terms)}

        self.fitted = True

        return self
    
    def transform(self, docs: list[list[str]]):
        if not self.fitted:
            raise ValueError("Vectorizer not fitted. Call 'fit' first.")
        
        n_docs = len(docs)
        vocab_len = len(self.vocab)
        vectors = np.zeros((n_docs, vocab_len))

        for i, doc in enumerate(docs):
            tf = self._calculate_term_frequency(doc)

            for term, term_freq in tf.items():
                if term in self.vocab:
                    idx = self.vocab[term]
                    vectors[i, idx] = term_freq * self.idf[term]
            vectors[i] = euclidean_normalization(vectors[i])

        return vectors