from controllers.preprocessing import TextPreprocessor
from controllers.tfidf_vectorizer import TfIdfVectorizer, TfIdfRetriever
from functools import lru_cache
from gensim.models import KeyedVectors
from controllers.weighted_word2vec import Word2VecRetriever, Word2VecMethod
from controllers.jaccard import JaccardRetriever
from controllers.transformer import Transformer, PoolingMethod, TransformerRetriever
from controllers.siamese_lstm import LSTMRetriever, SiameseLSTM
from services.dense_vector_engine import DenseVectorEngine
from controllers.hybrid import HybridRetriever
from spacy.language import Language
from typing import Literal

class SimilarityEngine:
	def __init__(self, 
		word2vecs: dict[str, KeyedVectors], 
		sberts: dict[str, Transformer], 
		berts: dict[str, Transformer], 
		nlps: dict[str, Language], 
		lstms: dict[str, SiameseLSTM], 
		engines: dict[str, DenseVectorEngine],
		min_n: int=1, 
		max_n: int=2
	):
		self.word2vecs = word2vecs
		self.sberts = sberts
		self.berts = berts
		self.nlps = nlps
		self.lstms = lstms
		self.engines = engines

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

	def search_jaccard(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = JaccardRetriever(self.preprocess_stems).fit(corpus, language)
		return retriever.search(query, top_k)
		
	def search_tf_idf(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = TfIdfRetriever(
			vectorizer=TfIdfVectorizer(),
			preprocessor_fn=self.preprocess_stems
		).fit(corpus, language)

		return retriever.search(query, top_k)
	
	def search_transformer(self, query: str, corpus: list[str], top_k: int, language: str, model_type: Literal["sbert", "bert"] = "sbert", pooling: PoolingMethod = "mean"):
		if model_type == "sbert":
			models = self.sberts
		elif model_type == "bert":
			models = self.berts
		else:
			raise ValueError(f"Unknown model type {model_type}")

		retriever = TransformerRetriever(models, pooling=pooling).fit(corpus, language)

		return retriever.search(query, top_k)
	
	def search_word2vec(self, query: str, corpus: list[str], top_k: int, language: str, method: Word2VecMethod = "pos"):
		retriever = Word2VecRetriever(
			word2vecs=self.word2vecs,
			preprocessor_fn=self.preprocess_lemmas,
			method=method
		).fit(corpus, language)

		return retriever.search(query, top_k)
	
	def search_lstm(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = LSTMRetriever(self.lstms).fit(corpus, language)
		return retriever.search(query, top_k)

	def search_dense_vector_engine(self, query: str, top_k: int, model_name: str, language: str, node_key: str):
		engine = self.engines.get(model_name)
		if engine is None:
			raise ValueError(f"No engine found with name '{model_name}'")

		retriever = engine.get_retriever(language, node_key)
		return retriever.search(query, top_k)

	def search_hybrid(self, query: str, corpus: list[str], top_k: int, language: str, model_name: str, node_key: str,):
		sparse_retriever = TfIdfRetriever(
			vectorizer=TfIdfVectorizer(),
			preprocessor_fn=self.preprocess_stems
		).fit(corpus, language)
		
		engine = self.engines.get(model_name)
		if engine is None:
			raise ValueError(f"No engine found with name '{model_name}'")

		dense_retriever = engine.get_retriever(language, node_key)

		retriever = HybridRetriever(
			sparse=sparse_retriever,
			dense=dense_retriever,
			fusion_method="reciprocal_rank_fusion",
			rrf_k=60,
			sigmoid_k=8.0
		)

		return retriever.search(query, top_k)
