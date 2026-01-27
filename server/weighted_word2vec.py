from tfidf_vectorizer import TfIdfVectorizer
from preprocessing import TextPreprocessor
import numpy as np
from math_utils import euclidean_normalization
from gensim.models import KeyedVectors

class WeightedWord2Vec():
	word2vec_vectors: KeyedVectors
	text_preprocessor: TextPreprocessor
	vectorizer: TfIdfVectorizer
	idf_dict: dict[str, float]
	n_docs: int

	def __init__(self, word2vec_vectors: KeyedVectors, language: str):
		self.word2vec_vectors = word2vec_vectors
		self.text_preprocessor = TextPreprocessor(language)
		self.vectorizer = TfIdfVectorizer(self.preprocess_batch)

	def preprocess(self, text: str):
		return self.text_preprocessor.preprocess(text, stem=False, remove_accents=False)

	def preprocess_batch(self, texts: list[str]):
		return [self.preprocess(text) for text in texts]
	
	def weigthed_vector(self, tokens: list[str], weights: np.ndarray):
		vector_size = self.word2vec_vectors.vector_size
		
		vectors = []
		for token in tokens:
			if token in self.word2vec_vectors:
				vectors.append(self.word2vec_vectors[token])
			else:
				vectors.append(np.zeros(vector_size))
		vectors = np.array(vectors)
		return weights @ vectors
	
	def idf_weights(self, tokens: list[str]):
		return np.array([self.idf_dict.get(token, np.log(self.n_docs)) for token in tokens])

	def idf_weighted(self, docs: list[str]):
		result = []
		for doc in docs:
			tokens = self.preprocess(doc)
			weights = self.idf_weights(tokens)
			vector = self.weigthed_vector(tokens, weights)
			result.append(vector)
		return np.array(result)
	
	def no_weighted(self, docs: list[str]):
		result = []
		for doc in docs:
			tokens = self.preprocess(doc)			
			weights = np.ones((len(tokens)))
			vector = self.weigthed_vector(tokens, weights)
			result.append(vector)
		return np.array(result)
		
	def calculate_center(self, tf: np.ndarray, tokens: list[str]):
		weights = self.idf_weights(tokens) * tf
		return self.weigthed_vector(tokens, weights)

	def center_weighted(self, docs: list[str]):
		result = []
		for doc in docs:
			vectorizer = TfIdfVectorizer(self.preprocess_batch, use_idf=False)
			tf = vectorizer.fit_transform([doc])

			center = self.calculate_center(tf[0], vectorizer.get_terms())
			result.append(center - self.corpus_center)
		result = np.array(result)
		return result

	def fit(self, corpus: list[str]):
		self.vectorizer.fit(corpus)

		terms = self.vectorizer.get_terms()
		self.idf_dict = dict((zip(terms, self.vectorizer.get_idf())))
		self.n_docs = len(corpus)

		corpus_tokens = self.preprocess_batch(corpus)
		corpus_tokens = [token for tokens in corpus_tokens for token in tokens]
		vocab_tf = self.vectorizer.calculate_term_frequency(corpus_tokens)
		self.corpus_center = self.calculate_center(vocab_tf, terms)
		
		return self

	def transform(self, docs: list[str]):
		result = self.idf_weighted(docs)
		result = euclidean_normalization(result)
		return result
	
	def fit_transform(self, corpus: list[str]):
		self.fit(corpus)
		result = self.transform(corpus)
		return result