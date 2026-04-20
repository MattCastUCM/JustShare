from controllers.tfidf_vectorizer import TfIdfVectorizer
import numpy as np
from similarities.vector_numpy import l2_normalize
from gensim.models import KeyedVectors
from abc import ABC, abstractmethod
from collections import Counter
from controllers.retriever import BaseRetriever
from similarities.vector_numpy import cosine_similarity
from schemas.similarity import SimilarityMatch
from typing import Literal

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
		return l2_normalize(X)

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
		return l2_normalize(X)

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
		return l2_normalize(result)
	
Word2VecMethod = Literal["pos", "idf", "center"]

class Word2VecRetriever(BaseRetriever):
	def __init__(
		self,
		word2vecs: dict,
		preprocessor_fn,
		method: Word2VecMethod
	):
		self.word2vecs = word2vecs
		self.preprocess = preprocessor_fn
		self.method = method

	def fit(self, corpus: list[str], language: str):
		self.language = language
		self.corpus = corpus

		wv = self.word2vecs.get(language)
		if wv is None:
			raise ValueError(f"No Word2Vec found for language '{language}'")
		
		tokenized = [self.preprocess(doc, language) for doc in corpus]

		self.corpus_tokens = [[token.lemma for token in doc] for doc in tokenized]

		kwargs = {}

		if self.method == "pos":
			self.corpus_pos = [[token.pos for token in doc] for doc in tokenized]
			kwargs["pos_docs"] = self.corpus_pos
			self.model = POSWeightedWord2Vec(wv)

		elif self.method == "idf":
			self.model = IdfWeightedWord2Vec(wv)

		elif self.method == "center":
			self.model = CenterWeightedWord2Vec(wv)

		else:
			raise ValueError(f"Unknown method: {self.method}")
		
		self.corpus_vectors = self.model.fit_transform(self.corpus_tokens, **kwargs)

		return self

	def search(self, query: str, top_k: int=3):
		if self.corpus_vectors is None:
			raise ValueError("Retriever not fitted. Call 'fit' first.")
		
		tokenized = self.preprocess(query, self.language)

		query_tokens = [token.lemma for token in tokenized]

		kwargs = {}

		if self.method == "pos":
			query_pos = [token.pos for token in tokenized]
			kwargs["pos_docs"] = [query_pos]

		query_embedding = self.model.transform([query_tokens], **kwargs)[0]

		scores = cosine_similarity(self.corpus_vectors, query_embedding)

		top_indices = np.argsort(scores)[::-1][:top_k]

		return [
			SimilarityMatch(
				index=int(i),
				score=float(scores[i]),
				text=self.corpus[i],
			)
			for i in top_indices
		]
	