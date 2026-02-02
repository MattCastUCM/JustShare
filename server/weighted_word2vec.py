from tfidf_vectorizer import TfIdfVectorizer
from preprocessing import TextPreprocessor, Token
import numpy as np
from math_utils import euclidean_normalization
from gensim.models import KeyedVectors
from abc import ABC, abstractmethod
from spacy.language import Language
from loguru import logger

class WeightedWord2Vec(ABC):
	def __init__(self, wv: KeyedVectors, language: str, spacy_models: dict[str, Language]):
		self.wv = wv
		self.pre = TextPreprocessor(language, spacy_models)

	def preprocess(self, text: str):
		tokens = self.pre.pipeline_tokenize(
            text,
            steps=[
                self.pre.clean_text,
                self.pre.autocorrect,
            ],
        )
		tokens = self.pre.preprocess(
            tokens,
            steps=[
				lambda tokens: self.pre.lemmatize_and_pos(tokens, lemmatize=True, get_pos=True),
				self.pre.remove_stopwords
            ],
        )

		return tokens
	
	def preprocess_lemmas(self, text: str):
		tokens = self.preprocess(text)
		tokens = [token.lemma for token in tokens]
		return tokens
	
	def preprocess_batch(self, texts: list[str]):
		return [self.preprocess_lemmas(text) for text in texts]
	
	def weigthed_vector(self, tokens: list[str], weights: np.ndarray):
		vector_size = self.wv.vector_size
		
		vectors = []
		for token in tokens:
			if token in self.wv:
				vectors.append(self.wv[token])
			else:
				vectors.append(np.zeros(vector_size))
		vectors = np.array(vectors)
		return weights @ vectors
	
	def fit(self, corpus: list[str]):
		return self

	@abstractmethod
	def transform(self, docs: list[str]) -> np.ndarray:
		pass
	
	def fit_transform(self, corpus: list[str]):
		self.fit(corpus)
		result = self.transform(corpus)
		return result
	
class IdfWeightedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors, language: str, spacy_models: dict[str, Language]):
		super().__init__(wv, language, spacy_models)
		self.vectorizer = TfIdfVectorizer(self.preprocess_batch)
	
	def idf_weights(self, tokens: list[str]):
		weights = [self.idf_dict.get(token, np.log(self.n_docs)) for token in tokens]
		return np.array(weights)

	def idf_weighted(self, docs: list[str]):
		result = []
		for doc in docs:
			tokens = self.preprocess_lemmas(doc)
			weights = self.idf_weights(tokens)
			vector = self.weigthed_vector(tokens, weights)
			result.append(vector)
		return np.array(result)
	
	def fit(self, corpus: list[str]):
		self.vectorizer.fit(corpus)

		terms = self.vectorizer.get_terms()
		self.idf_dict = dict((zip(terms, self.vectorizer.get_idf())))
		self.n_docs = len(corpus)
		
		return self

	def transform(self, docs: list[str]):
		result = self.idf_weighted(docs)
		result = euclidean_normalization(result)
		return result

class CenterWeigtedWord2Vec(WeightedWord2Vec):
	def __init__(self, wv: KeyedVectors, language: str, spacy_models: dict[str, Language]):
		super().__init__(wv, language, spacy_models)
		self.vectorizer = TfIdfVectorizer(self.preprocess_batch)
	
	def idf_weights(self, tokens: list[str]):
		weights = [self.idf_dict.get(token, np.log(self.n_docs)) for token in tokens]
		return np.array(weights)
		
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
		result = self.center_weighted(docs)
		result = euclidean_normalization(result)
		return result

class POSWeightedWord2Vec(WeightedWord2Vec):
	POS_WEIGHTS = {
		"VERB": 0.4,
		"NOUN": 0.5,
		"PROPN": 0.7,
		"ADJ": 0.3,
		"ADP": 0.1,		# Preposiciones
	}

	DEFAULT_POS_WEIGHT = 0.2

	def pos_weights(self, tokens: list[Token]):
		weights = [self.POS_WEIGHTS.get(token.pos, self.DEFAULT_POS_WEIGHT) for token in tokens]
		return np.array(weights)
	
	def pos_weigthed(self, docs: list[str]):
		result = []
		for doc in docs:
			tokens = self.preprocess(doc)
			logger.debug(tokens)
			weights = self.pos_weights(tokens)
			tokens = [token.lemma for token in tokens]
			vector = self.weigthed_vector(tokens, weights)
			result.append(vector)
		return np.array(result)

	def transform(self, docs: list[str]):
		result = self.pos_weigthed(docs)
		result = euclidean_normalization(result)
		return result