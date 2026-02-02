from collections import Counter
import numpy as np
from math_utils import euclidean_normalization
from collections.abc import Callable
from typing import Literal

class TfIdfVectorizer:
    def __init__(self, tokenizer: Callable[[list[str]], list[list[str]]], use_idf: bool = True, norm: Literal["l2"] | None = "l2"):
        self.tokenizer = tokenizer
        self.fitted = False
        self.use_idf = use_idf
        self.norm = norm

    def calculate_term_frequency(self, tokens: list[str]):
        tf = np.zeros(len(self.vocab))
        doc_len = len(tokens)

        if doc_len <= 0:
            return tf
        
        counts = Counter(tokens)

        # Sublinear scaling
        for term, count in counts.items():
            idx = self.vocab.get(term)
            if idx is not None:
                tf[idx] = 1 + np.log(count / doc_len)
        return tf
    
    def _calculate_document_frequency(self, corpus_tokens: list[list[str]]):
        df = Counter()

        for tokens in corpus_tokens:
            unique_term = set(tokens)
            df.update(unique_term)

        return df
    
    def _calculate_inverse_document_frequency(self, terms: list[str], df: Counter, n_docs: int):
        doc_freqs = np.array([df[term] for term in terms])
        # Smoothing
        # return np.log((n_docs + 1) / (doc_freqs + 1)) + 1
        return np.log(n_docs / (doc_freqs + 1))

    def fit(self, corpus: list[str]):
        n_docs = len(corpus)
        self.corpus_tokens = self.tokenizer(corpus)

        df = self._calculate_document_frequency(self.corpus_tokens)

        self.terms = sorted(df.keys())
        self.vocab = {term: i for i, term in enumerate(self.terms)}

        if self.use_idf:
            self.idf = self._calculate_inverse_document_frequency(self.terms, df, n_docs)
        else:
            self.idf = np.ones(len(self.vocab))

        self.fitted = True

        return self
    
    def transform(self, docs: list[str]):
        if not self.fitted:
            raise ValueError("Vectorizer not fitted. Call 'fit' first.")
        
        result = []

        tokenized_docs = self.tokenizer(docs)

        for tokens in tokenized_docs:
            tf = self.calculate_term_frequency(tokens)
            result.append(tf * self.idf)
        result = np.array(result)

        if self.norm == "l2":
            result = euclidean_normalization(result)

        return result

    def fit_transform(self, corpus: list[str]):
        self.fit(corpus)
        result = self.transform(corpus)
        return result
    
    def get_terms(self) -> list[str]:
        return self.terms
    
    def get_idf(self) -> np.ndarray:
        return self.idf