
from ..models.preprocessing import TextPreprocessor
from ..models.tfidf_vectorizer import TfIdfVectorizer
from ..utils.similarity import jaccard_similarity, cosine_similarity
from functools import lru_cache
from gensim.models import KeyedVectors
from ..models.weighted_word2vec import POSWeightedWord2Vec, IdfWeightedWord2Vec
from ..models.sentence_embeddings import SentenceEmbeddings, PoolingMethod
import numpy as np
from spacy.language import Language
from typing import Literal

class SimilarityEngine:
	def __init__(self, word2vec: dict[str, KeyedVectors], sentence_transformers: dict[str, SentenceEmbeddings], bert_models: dict[str, SentenceEmbeddings], nlps: dict[str, Language], max_n: int):
		self.word2vec = word2vec
		self.sentence_transformers = sentence_transformers
		self.bert_models = bert_models
		self.nlps = nlps
		self.max_n = max_n

	@lru_cache(maxsize=8)
	def get_preprocessor(self, language: str):
		return TextPreprocessor(language, self.nlps)

	def preprocess(self, text: str, language: str):
		pre = self.get_preprocessor(language)
		tokens = pre.pipeline_tokenize(
			text,
			steps=[
				pre.clean_text,
				pre.autocorrect,
			],
		)
		tokens = pre.preprocess(
			tokens,
			steps=[
				pre.remove_stopwords,
				pre.stem,
				lambda tokens: pre.map_tokens(
					tokens,
					fields=["stemmed_word"],
					function=pre.remove_accents,
				)
			],
		)
		stemmed_tokens = [token.stemmed_word for token in tokens]
		ngrams = pre.add_ngrams(stemmed_tokens, self.max_n)
		return ngrams
		
	def preprocess_batch(self, texts: list[str], language: str):
		return [self.preprocess(text, language) for text in texts]

	def similarity_jaccard(self, corpus: list[str], text: str, language: str):
		corpus_tokens = self.preprocess_batch(corpus, language)
		query_tokens = self.preprocess(text, language)
		
		scores = np.array([
			jaccard_similarity(query_tokens, tokens)
			for tokens in corpus_tokens
		])

		return scores
		
	def similarity_tf_idf(self, corpus: list[str], text: str, language: str):
		model = TfIdfVectorizer(
			tokenizer=lambda texts: self.preprocess_batch(texts, language)
		)
		corpus_vectors = model.fit_transform(corpus)

		query_vector = model.transform([text])

		scores = cosine_similarity(corpus_vectors, query_vector)
		
		return scores
	
	def similarity_transformer(self, corpus: list[str], text: str, language: str, model_type: Literal["sentence", "bert"] = "sentence", pooling: PoolingMethod = "mean"):
			if model_type == "sentence":
				model = self.sentence_transformers.get(language)
			elif model_type == "bert":
				model = self.bert_models.get(language)
			
			if model is None:
				raise ValueError(f"No {model_type} model found for language '{language}'.")
			
			combined = corpus + [text]
			combined_embeddings = model.encode(combined, pooling)

			corpus_embeddings = combined_embeddings[:-1]
			query_embedding = combined_embeddings[-1]

			scores = cosine_similarity(corpus_embeddings, query_embedding)

			return scores
	
	def similarity_word2vec(self, corpus: list[str], text: str, language: str, method: Literal["pos", "idf"] = "pos"):
		wv = self.word2vec.get(language)
		if wv is None:
			raise ValueError(f"No Word2Vec model found for language '{language}'.")

		if method == "pos":
			model = POSWeightedWord2Vec(wv, language, self.nlps)
		elif method == "idf":
			model = IdfWeightedWord2Vec(wv, language, self.nlps)
	
		corpus_vectors = model.fit_transform(corpus)
		query_vector = model.transform([text])

		scores = cosine_similarity(corpus_vectors, query_vector)

		return scores
	