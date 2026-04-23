from gensim.models import KeyedVectors
from core.settings import get_settings
from controllers.encoders.transformer import Transformer
from controllers.encoders.sentence_lstm import SentenceLSTM
from services.lazy_loader import LazyLoader
from loguru import logger
import spacy
import os

class ModelRegistry:
	def __init__(self, languages: set[str]):
		self.settings = get_settings()
		self.languages = languages

		self.loaders: dict[str, dict[str, LazyLoader]] = {
			"sbert": {},
			"bert": {},
			"word2vec": {},
			"lstm": {},
			"spacy": {},
		}
	
	def get(self, model_type: str, language: str):
		return self.loaders[model_type][language].model

	def resolve(self, model_type: str):
		return {
			lang: loader.model
			for lang, loader in self.loaders[model_type].items()
		}

	def build(self):
		self.build_sbert()
		self.build_bert()
		self.build_word2vec()
		self.build_lstm()
		self.build_spacy()

	def _create_loader(self, model_type: str, lang: str, source: str, fn):
		logger.debug(f"Registering loader: {model_type} [{lang}] -> {source}")
		
		return LazyLoader(
			loader=lambda: fn(source),
			identifier=lang,
			model_type=model_type
		)
	
	def build_sbert(self):
		for lang in self.languages:
			path = self.settings.sbert.get(lang)
			if not path:
				logger.warning(f"SBERT missing for language: {lang}")
				continue

			self.loaders["sbert"][lang] = self._create_loader(
				"SBERT", lang, path,
				lambda name: Transformer(name)
			)

	def build_bert(self):
		for lang in self.languages:
			path = self.settings.bert.get(lang)
			if not path:
				logger.warning(f"BERT missing for language: {lang}")
				continue

			self.loaders["bert"][lang] = self._create_loader(
				"BERT", lang, path,
				lambda name: Transformer(name)
			)

	def build_word2vec(self):
		for lang in self.languages:
			path = self.settings.word2vec.get(lang)
			if not path or not os.path.exists(path):
				logger.warning(f"Word2Vec missing for language: {lang}")
				continue

			self.loaders["word2vec"][lang] = self._create_loader(
				"Word2Vec", lang, path,
				lambda path: KeyedVectors.load_word2vec_format(path, binary=True)
			)

	def build_lstm(self):
		for lang in self.languages:
			path = self.settings.siamese_lstm.get(lang)
			if not path or not os.path.exists(path):
				logger.warning(f"LSTM missing config for language: {lang}")
				continue

			self.loaders["lstm"][lang] = self._create_loader(
				"SiameseLSTM", lang, path,
				lambda path: SentenceLSTM(path)
			)

	def build_spacy(self):
		for lang in self.languages:
			path = self.settings.spacy.get(lang)
			if not path:
				logger.warning(f"spaCy missing for language: {lang}")
				continue

			self.loaders["spacy"][lang] = self._create_loader(
				"spaCy", lang, path,
				lambda name: spacy.load(name, disable=["parser", "ner"])
			)
	
	def active_model_types(self):
		return [
			model_type
			for model_type, langs in self.loaders.items()
			if len(langs) > 0
		]