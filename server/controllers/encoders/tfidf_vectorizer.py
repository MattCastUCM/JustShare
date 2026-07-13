from collections import Counter
import numpy as np
from controllers.encoders.encoder import Encoder
from typing import Callable
from utils.vector_numpy import l2_normalize
from schemas.similarity import SearchMethod

class TfIdfVectorizer(Encoder):
	def __init__(self, preprocessor_fn: Callable[[str], list[str]], use_idf: bool = True, sublinear_tf: bool = True, smooth_idf: bool = True):
		super().__init__(SearchMethod.TFIDF)
		self.preprocessor = preprocessor_fn
		self.fitted = False
		self.use_idf = use_idf
		self.sublinear_tf = sublinear_tf
		self.smooth_idf = smooth_idf

	def calculate_term_frequency(self, tokens: list[str]):
		tf = np.zeros(len(self.vocab))
		doc_len = len(tokens)

		if doc_len <= 0:
			return tf
		
		counts = Counter(tokens)

		if self.sublinear_tf:
			# TF sublineal: 1 + log(term_frequency)
			for term, count in counts.items():
				idx = self.vocab.get(term)
				if idx is not None:
					tf[idx] = 1 + np.log(count / doc_len)
		else:
			for term, count in counts.items():
				idx = self.vocab.get(term)
				if idx is not None:
					tf[idx] = count / doc_len
		return tf
	
	def _calculate_document_frequency(self, corpus_tokens: list[list[str]]):
		df = Counter()

		for tokens in corpus_tokens:
			unique_term = set(tokens)
			df.update(unique_term)

		return df
	
	def _calculate_inverse_document_frequency(self, df: Counter, n_docs: int):
		idf = np.zeros(len(self.terms))
		for i, term in enumerate(self.terms):
			doc_freq = df.get(term, 0)
			if self.smooth_idf:
				idf[i] = np.log((n_docs + 1) / (doc_freq + 1)) + 1
			else:
				idf[i] = np.log(n_docs / (doc_freq + 1)) + 1
		return idf

	def fit(self, texts: list[str]):
		tokenized_docs = [self.preprocessor(text) for text in texts]

		n_docs = len(tokenized_docs)

		all_terms = set()
		for tokens in tokenized_docs:
			all_terms.update(tokens)
		self.terms = sorted(all_terms)
		self.vocab = {term: i for i, term in enumerate(self.terms)}

		if self.use_idf:
			df = self._calculate_document_frequency(tokenized_docs)
			self.idf = self._calculate_inverse_document_frequency(df, n_docs)
		else:
			self.idf = np.ones(len(self.terms))

		self.fitted = True

		return self
	
	def transform(self, texts: list[str], normalize: bool = True):
		if not self.fitted:
			raise ValueError("Vectorizer not fitted. Call 'fit' first.")
		
		tokenized_docs = [self.preprocessor(text) for text in texts]
		
		X = np.zeros((len(tokenized_docs), len(self.terms)))

		for i, tokens in enumerate(tokenized_docs):
			tf = self.calculate_term_frequency(tokens)
			X[i] = tf * self.idf

		if normalize:
			return l2_normalize(X)
		return X
	
	def get_feature_names(self):
		if not self.fitted:
			raise ValueError("Vectorizer not fitted.")
		return self.terms

	def get_idf(self):
		if not self.fitted:
			raise ValueError("Vectorizer not fitted.")
		if not self.use_idf:
			raise ValueError("IDF not computed because use_idf=False.")
		return self.idf
	
	def get_vocab(self):
		if not self.fitted:
			raise ValueError("Vectorizer not fitted.")
		return self.vocab
