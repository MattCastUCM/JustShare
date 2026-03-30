
from ..models.preprocessing import TextPreprocessor
from ..models.tfidf_vectorizer import TfIdfVectorizer
from ..utils.similarity import jaccard_similarity, cosine_similarity
from functools import lru_cache
from gensim.models import KeyedVectors
from ..models.weighted_word2vec import POSWeightedWord2Vec, IdfWeightedWord2Vec, CenterWeightedWord2Vec
from ..models.sentence_transformers import SentenceTransformers, PoolingMethod
import numpy as np
from spacy.language import Language
from typing import Literal

class SimilarityEngine:
	def __init__(self, word2vec: dict[str, KeyedVectors], sentence_transformers: dict[str, SentenceTransformers], bert_models: dict[str, SentenceTransformers], nlps: dict[str, Language], min_n: int = 2, max_n: int = 2):
		self.word2vec = word2vec
		self.sentence_transformers = sentence_transformers
		self.bert_models = bert_models
		self.nlps = nlps
		self.min_n = min_n
		self.max_n = max_n

	@lru_cache(maxsize=8)
	def get_preprocessor(self, language: str):
		nlp = self.nlps.get(language)
		if nlp is None:
			raise ValueError(f"No Spacy model found for language '{language}")
		return TextPreprocessor(language, nlp)

	def preprocess_stems(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		text_steps = [
			pre.clean_text,
			pre.remove_accents,
			pre.autocorrect,
		]

		token_steps = [
			pre.remove_stopwords,
			pre.stem,
			lambda tokens: pre.map_tokens(tokens, fields=["stem"], func=pre.remove_accents),
		]

		tokens = pre.run_pipeline(
			text=text,
			text_steps=text_steps,
			token_steps=token_steps,
		)

		ngrams = pre.add_ngrams_to_tokens(
			tokens=tokens,
			min_n=self.min_n,
			max_n=self.max_n,
			field="stem",
		)
		
		return [token.stem for token in ngrams]
	
	def preprocess_lemmas(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		text_steps = [
			pre.clean_text,
			pre.autocorrect,
		]

		token_steps = [
			pre.remove_stopwords,
		]

		return pre.run_pipeline(text, text_steps, token_steps)

	def similarity_jaccard(self, corpus: list[str], text: str, language: str):
		corpus_tokens = [self.preprocess_stems(doc, language) for doc in corpus]
		query_tokens = self.preprocess_stems(text, language)
		
		scores = np.array([
			jaccard_similarity(query_tokens, tokens)
			for tokens in corpus_tokens
		])

		return scores
		
	def similarity_tf_idf(self, corpus: list[str], text: str, language: str):
		all_texts = corpus + [text]
		tokenized = [self.preprocess_stems(doc, language) for doc in all_texts]

		corpus_tokens = tokenized[:-1]
		query_tokens = tokenized[-1]

		model = TfIdfVectorizer()

		corpus_vectors = model.fit_transform(corpus_tokens)

		query_vector = model.transform([query_tokens])

		scores = cosine_similarity(corpus_vectors, query_vector)
		
		return scores
	
	def similarity_transformer(self, corpus: list[str], text: str, language: str, model_type: Literal["sentence", "bert"] = "sentence", pooling: PoolingMethod = "mean"):
			if model_type == "sentence":
				model = self.sentence_transformers.get(language)
			elif model_type == "bert":
				model = self.bert_models.get(language)
			
			if model is None:
				raise ValueError(f"No {model_type} model found for language '{language}'")
			
			combined = corpus + [text]
			combined_embeddings = model.encode(combined, pooling)

			corpus_embeddings = combined_embeddings[:-1]
			query_embedding = combined_embeddings[-1]

			scores = cosine_similarity(corpus_embeddings, query_embedding)

			return scores
	
	def similarity_word2vec(self, corpus: list[str], text: str, language: str, method: Literal["pos", "idf", "center"] = "pos"):
		wv = self.word2vec.get(language)
		if wv is None:
			raise ValueError(f"No Word2Vec model found for language '{language}'")

		all_texts = corpus + [text]
		tokenized = [self.preprocess_lemmas(doc, language) for doc in all_texts]

		lemmas = [[token.lemma for token in doc] for doc in tokenized]

		corpus_tokens = lemmas[:-1]
		query_tokens = lemmas[-1]
		
		kwargs_corpus = {}
		kwargs_query = {}

		if method == "pos":
			pos_tags = [[token.pos for token in doc] for doc in tokenized]
			kwargs_corpus["pos_docs"] = pos_tags[:-1]
			kwargs_query["pos_docs"] = [pos_tags[-1]]
			model = POSWeightedWord2Vec(wv)
		elif method == "idf":
			model = IdfWeightedWord2Vec(wv)
		elif method == "center":
			model = CenterWeightedWord2Vec(wv)

		corpus_vectors = model.fit_transform(corpus_tokens, **kwargs_corpus)
		query_vector = model.transform([query_tokens], **kwargs_query)

		scores = cosine_similarity(corpus_vectors, query_vector)

		return scores
	