from gensim.models import KeyedVectors
from core.settings import get_settings
from controllers.encoders.transformer import Transformer
from controllers.encoders.sentence_lstm import SentenceLSTM
from services.lazy_loader import LazyLoader
from typing import Callable
import joblib
from loguru import logger
import spacy
import os

class ModelRegistry:
	def __init__(self, languages: set[str]):
		self.settings = get_settings()
		self.languages = languages

		self.spacy_loaders: dict[str, LazyLoader] = {}
		self.dense_loaders: dict[str, dict[str, LazyLoader]] = {
			"sbert": {},
			"word2vec": {},
			"lstm": {},
		}

		self.calibrator_loaders: dict[str, dict[str, LazyLoader]] = {}
	
	def get_dense(self, model_type: str, language: str):
		loader = self.dense_loaders.get(model_type, {}).get(language)
		return loader.model if loader else None

	def get_spacy(self, language: str):
		loader = self.spacy_loaders.get(language)
		return loader.model if loader else None

	def get_calibrator(self, model_type: str, language: str):
		loader = self.calibrator_loaders.get(model_type, {}).get(language)
		return loader.model if loader else None

	def resolve_all(self):				
		for langs in self.dense_loaders.values():
			for loader in langs.values():
				_ = loader.model

		for loader in self.spacy_loaders.values():
			_ = loader.model

		for langs in self.calibrator_loaders.values():
			for loader in langs.values():
				_ = loader.model

	def build(self):
		self.build_transformer("sbert")
		self.build_word2vec()
		self.build_lstm()
		self.build_spacy()

	def _create_loader(self, model_type: str, lang: str, loader: Callable):
		logger.debug(f"Registering {model_type} loader for '{lang}'.")
		
		return LazyLoader(
			loader=loader,
			language=lang,
			model_type=model_type
		)
	
	def _build_calibrator(self, model_type: str, lang: str, path: str):
		if model_type not in self.calibrator_loaders:
			self.calibrator_loaders[model_type] = {}

		if not path or not os.path.exists(path):
			logger.warning(f"{model_type}_calibrator missing for '{lang}'.")
		else:
			self.calibrator_loaders[model_type][lang] = self._create_loader(
				f"{model_type} calibrator", lang,
				lambda p=path: joblib.load(p)
			)
	
	def build_transformer(self, model_type: str):
		# Se obtienen las rutas del modelo correspondiente
		config = getattr(self.settings, model_type)

		for lang in self.languages:
			# Para cada idioma se obtiene el nombre del modelo que utilizar
			name = config.get(lang)
			if not name:
				logger.warning(f"{model_type.upper()} missing for '{lang}'.")
			else:
				self.dense_loaders[model_type][lang] = self._create_loader(
					model_type,
					lang,
					lambda model_type=model_type, name=name: Transformer(model_type, name)
				)

	def build_word2vec(self):
		for lang in self.languages:
			path = self.settings.word2vec.get(lang)
			if not path or not os.path.exists(path):
				logger.warning(f"Word2Vec missing for '{lang}'")
			else:
				self.dense_loaders["word2vec"][lang] = self._create_loader(
					"word2vec", lang,
					lambda: KeyedVectors.load_word2vec_format(path, binary=True)
				)

	def build_lstm(self):
		for lang in self.languages:
			path = self.settings.siamese_lstm.get(lang)
			if not path or not os.path.exists(path):
				logger.warning(f"LSTM missing config for '{lang}'")
			else:
				model_type = "lstm"
				self.dense_loaders[model_type][lang] = self._create_loader(
					"siamese_lstm", lang,
					lambda p=path: SentenceLSTM(p)
				)
				calibrator_path = os.path.join(path, "iso.joblib")
				self._build_calibrator(model_type, lang, calibrator_path)

	def build_spacy(self):
		for lang in self.languages:
			name = self.settings.spacy.get(lang)
			if not name:
				logger.warning(f"spaCy missing for '{name}'")
			else:
				self.spacy_loaders[lang] = self._create_loader(
					"spaCy", lang,
					lambda n=name: spacy.load(n, disable=[
						"parser",
						"ner"
					])
				)
	
	def active_model_types(self):
		return [
			model_type
			for model_type, langs in self.dense_loaders.items()
			if len(langs) > 0
		]