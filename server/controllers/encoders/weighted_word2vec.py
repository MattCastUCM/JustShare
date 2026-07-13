from controllers.encoders.tfidf_vectorizer import TfIdfVectorizer
import numpy as np
from gensim.models import KeyedVectors
from controllers.encoders.encoder import Encoder
from collections import Counter
from typing import Callable
from abc import abstractmethod
from utils.vector_numpy import l2_normalize
from schemas.similarity import SearchMethod

class WeightedWord2Vec(Encoder):
	def __init__(self, name: SearchMethod, wv: KeyedVectors, tokenizer_fn: Callable[[str], list[str]]):
		super().__init__(name)
		self.wv = wv
		self.tokenizer = tokenizer_fn

	def weighted_vector(self, tokens: list[str], weights: np.ndarray):
		vector_size = self.wv.vector_size

		if len(tokens) == 0:
			return np.zeros(vector_size)
		
		vectors = []
		for token in tokens:
			if token in self.wv:
				vectors.append(self.wv[token])
			else:
				vectors.append(np.zeros(vector_size))
		vectors = np.array(vectors)
		return weights @ vectors
	
	@abstractmethod
	def _transform(self, texts: list[str]):
		raise NotImplementedError()
	
	def transform(self, texts: list[str], normalize: bool = True):
		X = self._transform(texts)
		if normalize:
			return l2_normalize(X)
		return X
	
class IdfWeightedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors, tokenizer_fn: Callable[[str], list[str]]):
		super().__init__(SearchMethod.WORD2VEC_IDF, wv, tokenizer_fn)

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
	
	def fit(self, texts: list[str]):
		self.vectorizer = TfIdfVectorizer(self.tokenizer)
		self.vectorizer.fit(texts)

		terms = self.vectorizer.get_feature_names()
		idf = self.vectorizer.get_idf()
		self.idf_dict = dict(zip(terms, idf))
		self.n_docs = len(texts)
		
		return self

	def _transform(self, texts: list[str]):
		tokenized_docs = [self.tokenizer(doc) for doc in texts]

		return self._idf_weighted(tokenized_docs)

class CenterWeightedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors, preprocess_fn):
		super().__init__(SearchMethod.WORD2VEC_CENTER, wv, preprocess_fn)
		
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
		
	def fit(self, texts: list[str]):
		tokenized_docs = [self.tokenizer(doc) for doc in texts]

		vectorizer = TfIdfVectorizer(self.tokenizer)
		vectorizer.fit(texts)

		self.terms = vectorizer.get_feature_names()
		idf = vectorizer.get_idf()
		self.idf_dict = dict(zip(self.terms, idf))
		self.n_docs = len(texts)
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

	def _transform(self, texts: list[str]):
		tokenized_docs = [self.tokenizer(doc) for doc in texts]

		return self._center_weighted(tokenized_docs)

class POSWeightedWord2Vec(WeightedWord2Vec):
	POS_WEIGHTS = {
		"VERB": 0.4,
		"NOUN": 0.5,
		"PROPN": 0.7,
		"ADJ": 0.3,
		"ADP": 0.1,		# Preposiciones
	}

	DEFAULT_POS_WEIGHT = 0.2

	def __init__(self, wv: KeyedVectors, tokenizer_fn: Callable[[str], list[str]], pos_fn: Callable[[str], list[str]]):
		super().__init__(SearchMethod.WORD2VEC_POS, wv, tokenizer_fn)
		self.pos_tagger = pos_fn

	def _pos_weights(self, pos_tags: list[str]):
		weights = [self.POS_WEIGHTS.get(pos, self.DEFAULT_POS_WEIGHT) for pos in pos_tags]
		return np.array(weights)
	
	def fit(self, texts: list[str]):
		pass
	
	def _transform(self, texts: list[str]):
		tokenized_docs = [self.tokenizer(doc) for doc in texts]
		pos_docs = [self.pos_tagger(doc) for doc in texts]

		result = []
		for tokens, pos_tags in zip(tokenized_docs, pos_docs):
			if len(tokens) != len(pos_tags):
				raise ValueError("Tokens and POS tags must align")

			weights = self._pos_weights(pos_tags)
			vector = self.weighted_vector(tokens, weights)
			result.append(vector)

		return np.array(result)
	