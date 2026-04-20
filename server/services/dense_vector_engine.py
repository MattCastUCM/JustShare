from controllers.faiss import FaissRetriever
from typing import Iterable
from typing import Callable
import numpy as np
import os

class DenseVectorEngine:
	def __init__(self, models: dict[str, Callable[[list[str]], np.ndarray]], model_name: str, base_dir: str):
		self.models = models
		self.model_name = model_name
		self.base_dir = base_dir

		self.retrievers: dict[str, dict[str, FaissRetriever]] = {}
		os.makedirs(self.base_dir, exist_ok=True)

	def _get_model_for_language(self, language: str):
		if language not in self.models:
			raise ValueError(f"No model for language: {language}")
		return self.models[language]

	def _flatten_responses(self, fixed_responses: list, node_key: str):
		flat_texts = []
		flat_meta = []
		
		sentence_index = 0

		for group_id, group in enumerate(fixed_responses):
			for sentence_id, text in enumerate(group["text"]):
				flat_texts.append(text)
				flat_meta.append({
					"index": sentence_index,
					"text": text,
					"group_index": group_id,
					"sentence_index": sentence_id,
					"node": node_key
				})

				sentence_index += 1

		return flat_texts, flat_meta

	def build_node(self, language: str, node_key: str, fixed_responses: list, index_type: str = "flat"):
		self.retrievers.setdefault(language, {})

		model = self._get_model_for_language(language)
		flat_texts, flat_meta = self._flatten_responses(fixed_responses, node_key)

		embeddings = model(flat_texts)
		dim = embeddings.shape[1]

		retriever = FaissRetriever(
			model=model,
			dimension=dim,
			index_type=index_type
		)
		retriever.fit(flat_texts, language)
		retriever.add_metadata(flat_meta)

		self.retrievers[language][node_key] = retriever

	def get_retriever(self, language: str, node_key: str):
		self.retrievers.setdefault(language, {})

		retriever = self.retrievers[language].get(node_key)
		if not retriever:
			raise ValueError(f"Node '{node_key}' not found for '{language}'")

		return retriever
	
	def save_node(self, language: str, node_key: str):
		dir = os.path.join(self.base_dir, language, node_key, self.model_name)
		os.makedirs(dir, exist_ok=True)

		retriever = self.retrievers[language][node_key]
		retriever.save(dir)

	def save_all(self):
		for lang in self.retrievers:
			for node in self.retrievers[lang]:
				self.save_node(lang, node)

	def load_node(self, language: str, node_key: str):
		self.retrievers.setdefault(language, {})
		dir = os.path.join(self.base_dir, language, node_key, self.model_name)

		model = self._get_model_for_language(language)

		retriever = FaissRetriever.load(model, dir)

		self.retrievers[language][node_key] = retriever

	def load_all(self, languages: Iterable[str]):
		for lang in os.listdir(self.base_dir):
			if lang in languages:
				lang_dir = os.path.join(self.base_dir, lang)
				for node in os.listdir(lang_dir):
					print(node)
					self.load_node(lang, node)
