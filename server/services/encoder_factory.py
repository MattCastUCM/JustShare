from services.model_registry import ModelRegistry
from controllers.preprocessing import TextPreprocessor
from controllers.encoders.weighted_word2vec import POSdWord2Vec, IdfdWord2Vec, IdfPosWord2Vec
from controllers.encoders.tfidf_vectorizer import TfIdfVectorizer
from controllers.encoders.jaccard import JaccardEncoder
from functools import lru_cache, partial
from controllers.encoders.encoder import Encoder
from schemas.similarity import SearchMethod

class EncoderFactory:
	def __init__(self, registry: ModelRegistry, min_n: int = 1, max_n: int = 2):
		self.registry = registry
		self.min_n = min_n
		self.max_n = max_n

	@lru_cache(maxsize=32)
	def get_preprocessor(self, language: str):
		spacy = self.registry.get_spacy(language)
		if spacy is None:
			raise ValueError(f"No spaCy model loaded for language '{language}'. ")
		return TextPreprocessor(language, spacy)

	def preprocess_stems(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		tokens = pre.preprocess(
			text=text,
			text_steps=[
				pre.clean_text,
			],
			token_steps=[
				pre.remove_stopwords,
				pre.compute_stems
			],
			with_features=False
		)

		ngrams = pre.generate_ngrams(
			tokens=tokens,
			min_n=self.min_n,
			max_n=self.max_n,
			field="stem",
		)

		return [token.text for token in ngrams]

	def _lemma_and_pos(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		tokens = pre.preprocess(
			text=text,
			text_steps=[
				pre.clean_text,
			],
			token_steps=[
			],
		)

		lemmas = [token.lemma for token in tokens]
		pos = [token.pos for token in tokens]

		return lemmas, pos

	def tokenize_lemmas(self, text: str, language: str):
		return self._lemma_and_pos(text, language)[0]

	def pos_tags(self, text: str, language: str):
		return self._lemma_and_pos(text, language)[1]

	def _bind_preprocessor(self, fn, language: str):
		return partial(fn, language=language)

	def get(self, method: SearchMethod, language: str) -> Encoder:
		model = None

		if method.model_type is not None:
			model = self.registry.get_dense(method.model_type, language)

			if method == SearchMethod.WORD2VEC_POS:
				return POSdWord2Vec(
					model,
					tokenizer_fn=self._bind_preprocessor(self.tokenize_lemmas, language),
					pos_fn=self._bind_preprocessor(self.pos_tags, language),
				)

			if method == SearchMethod.WORD2VEC_IDF:
				return IdfdWord2Vec(
					model,
					tokenizer_fn=self._bind_preprocessor(self.tokenize_lemmas, language)
				)
			
			if method == SearchMethod.WORD2VEC_IDF_POS:
				return IdfPosWord2Vec(
					model,
					tokenizer_fn=self._bind_preprocessor(self.tokenize_lemmas, language),
					pos_fn=self._bind_preprocessor(self.pos_tags, language)
				)

		if method == SearchMethod.TFIDF:
			return TfIdfVectorizer(
				self._bind_preprocessor(self.preprocess_stems, language)
			)

		if method == SearchMethod.JACCARD:
			return JaccardEncoder(
				self._bind_preprocessor(self.preprocess_stems, language)
			)

		if model is not None:
			return model

		raise ValueError(f"Unsupported search method: {method}")