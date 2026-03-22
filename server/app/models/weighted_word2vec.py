from .tfidf_vectorizer import TfIdfVectorizer
import numpy as np
from ..utils.math_utils import euclidean_normalization
from gensim.models import KeyedVectors
from abc import ABC, abstractmethod
from collections import Counter

class WeightedWord2Vec(ABC):
	def __init__(self, wv: KeyedVectors):
		self.wv = wv

	def weighted_vector(self, tokens: list[str], weights: np.ndarray):
		vector_size = self.wv.vector_size
		
		vectors = []
		for token in tokens:
			if token in self.wv:
				vectors.append(self.wv[token])
			else:
				vectors.append(np.zeros(vector_size))
		vectors = np.array(vectors)
		return weights @ vectors
	
	def fit(self, tokenized_docs: list[list[str]]):
		return self

	@abstractmethod
	def transform(self, tokenized_docs: list[list[str]], **kwargs) -> np.ndarray:
		pass
	
	def fit_transform(self, tokenized_docs: list[list[str]], **kwargs):
		self.fit(tokenized_docs)
		result = self.transform(tokenized_docs, **kwargs)
		return result
	
class IdfWeightedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors):
		super().__init__(wv)

	def _idf_weights(self, tokens: list[str]):
		weights = [self.idf_dict.get(token, np.log(self.n_docs)) for token in tokens]
		return np.array(weights)

	def _idf_weighted(self, tokenized_docs: list[list[str]]):
		result = []
		for tokens in tokenized_docs:
			weights = self._idf_weights(tokens)
			vector = self.weighted_vector(tokens, weights)
			result.append(vector)
		return np.array(result)
	
	def fit(self, tokenized_docs: list[list[str]]):
		self.vectorizer = TfIdfVectorizer()
		self.vectorizer.fit(tokenized_docs)

		terms = self.vectorizer.get_feature_names()
		idf = self.vectorizer.get_idf()
		self.idf_dict = dict(zip(terms, idf))
		self.n_docs = len(tokenized_docs)
		
		return self

	def transform(self, tokenized_docs: list[list[str]], **kwargs):
		X = self._idf_weighted(tokenized_docs)
		return euclidean_normalization(X)

class CenterWeightedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors):
		super().__init__(wv)
		
	def _idf_weights(self, tokens: list[str]):
		weights = [self.idf_dict.get(token, np.log(self.n_docs)) for token in tokens]
		return np.array(weights)
		
	def _calculate_center(self, tf: np.ndarray, tokens: list[str]):
		weights = self._idf_weights(tokens) * tf
		return self.weighted_vector(tokens, weights)

	def _center_weighted(self, tokenized_docs: list[list[str]]):
		result = []
		for tokens in tokenized_docs:
			# Calcular la term frequency para este documento utilizando el vocabulario de fit
			tf = np.zeros(len(self.vocab))
			vocab = self.vocab
			counts = Counter(tokens)
			for term, count in counts.items():
				idx = vocab.get(term)
				if idx is not None:
					tf[idx] = count

			center = self._calculate_center(tf, self.terms)
			result.append(center - self.corpus_center)
		return np.array(result)
		
	def fit(self, tokenized_docs: list[list[str]]):
		vectorizer = TfIdfVectorizer()
		vectorizer.fit(tokenized_docs)

		self.terms = vectorizer.get_feature_names()
		idf = vectorizer.get_idf()
		self.idf_dict = dict(zip(self.terms, idf))
		self.n_docs = len(tokenized_docs)
		self.vocab = vectorizer.vocab

		# Calcula el centroide del corpus sumando todas las frecuencias de los términos a lo largo del corpus
		all_tokens = []
		for tokens in tokenized_docs:
			all_tokens.extend(tokens)
		total_counts = Counter(all_tokens)
		tf_total = np.zeros(len(self.terms))
		for term, count in total_counts.items():
			idx = self.vocab.get(term)
			if idx is not None:
				tf_total[idx] = count

		self.corpus_center = self._calculate_center(tf_total, self.terms)
		
		return self

	def transform(self, tokenized_docs: list[list[str]], **kwargs):
		X = self._center_weighted(tokenized_docs)
		return euclidean_normalization(X)

class POSWeightedWord2Vec(WeightedWord2Vec):
	POS_WEIGHTS = {
		"VERB": 0.4,
		"NOUN": 0.5,
		"PROPN": 0.7,
		"ADJ": 0.3,
		"ADP": 0.1,		# Preposiciones
	}

	DEFAULT_POS_WEIGHT = 0.2

	def _pos_weights(self, pos_tags: list[str]):
		weights = [self.POS_WEIGHTS.get(pos, self.DEFAULT_POS_WEIGHT) for pos in pos_tags]
		return np.array(weights)
	
	def transform(self, tokenized_docs: list[list[str]], **kwargs):
		pos_docs = kwargs.get("pos_docs")

		if pos_docs is None:
			raise ValueError("pos_docs must be provided for POSWeightedWord2Vec")

		result = []

		for tokens, pos_tags in zip(tokenized_docs, pos_docs):
			if len(tokens) != len(pos_tags):
				raise ValueError("Tokens and POS tags must align")

			weights = self._pos_weights(pos_tags)
			vector = self.weighted_vector(tokens, weights)
			result.append(vector)

		result = np.array(result)
		return euclidean_normalization(result)