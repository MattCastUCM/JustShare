from services.model_registry import ModelRegistry
from controllers.preprocessing import TextPreprocessor
from controllers.encoders.weighted_word2vec import POSWeightedWord2Vec
from controllers.encoders.tfidf_vectorizer import TfIdfVectorizer
from controllers.encoders.jaccard import JaccardEncoder
from functools import lru_cache, partial

class EncoderFactory:
	def __init__(self, registry: ModelRegistry, min_n: int = 1, max_n: int = 2):
		self.registry = registry
		self.min_n = min_n
		self.max_n = max_n

	@lru_cache(maxsize=32)
	def get_preprocessor(self, language: str):
		spacy = self.registry.get("spacy", language)
		return TextPreprocessor(language, spacy)

	def preprocess_stems(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		tokens = pre.run_pipeline(
			text=text,
			text_steps=[
				pre.clean_text,
				pre.remove_accents,
				pre.autocorrect,
			],
			token_steps=[
				pre.remove_stopwords,
				pre.stem,
				lambda t: pre.map_tokens(t, fields=["stem"], func=pre.remove_accents),
			],
		)

		ngrams = pre.add_ngrams_to_tokens(
			tokens=tokens,
			min_n=self.min_n,
			max_n=self.max_n,
			field="stem",
		)

		return [token.stem for token in ngrams]

	def _lemma_and_pos(self, text: str, language: str):
		pre = self.get_preprocessor(language)

		tokens = pre.run_pipeline(
			text=text,
			text_steps=[
				pre.clean_text,
				pre.autocorrect,
			],
			token_steps=[
				pre.remove_stopwords,
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

	def get(self, model_type: str, language: str):
		model = self.registry.get(model_type, language)

		if model_type == POSWeightedWord2Vec.name:
			return POSWeightedWord2Vec(
				model, 
				tokenizer_fn=self._bind_preprocessor(self.tokenize_lemmas, language),
                pos_fn=self._bind_preprocessor(self.pos_tags, language),
			)

		if model_type == TfIdfVectorizer.name:
			return TfIdfVectorizer(
				self._bind_preprocessor(self.preprocess_stems, language)
			)
		
		if model_type == JaccardEncoder.name:
			return JaccardEncoder(
				self._bind_preprocessor(self.preprocess_stems, language)
			)
		
		return model
