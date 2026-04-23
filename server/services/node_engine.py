from controllers.retrievers.faiss import FaissRetriever
from controllers.encoders.encoder import Encoder
from loguru import logger
import os

class NodeEngine:
	def __init__(self, encoder: Encoder, base_dir: str, language: str):
		self.model = encoder
		self.base_dir = base_dir
		self.language = language

		self.retrievers: dict[str, FaissRetriever] = {}
		os.makedirs(self.base_dir, exist_ok=True)

	def _flatten_responses(self, fixed_responses: list, node_key: str):
		flat_texts = []
		flat_meta = []
		
		idx = 0
		for group_idx, group in enumerate(fixed_responses):
			for sentence_idx, text in enumerate(group["text"]):
				flat_texts.append(text)
				flat_meta.append({
					"index": idx,
					"text": text,
					"group_index": group_idx,
					"sentence_index": sentence_idx,
					"node": node_key
				})

				idx += 1

		return flat_texts, flat_meta

	def build_node(self, node_key: str, fixed_responses: list[str], index_type: str = "flat"):
		flat_texts, flat_meta = self._flatten_responses(fixed_responses, node_key)

		retriever = FaissRetriever(
			encoder=self.model,
			index_type=index_type
		)
		retriever.fit(flat_texts)
		retriever.add_metadata(flat_meta)

		self.retrievers[node_key] = retriever

	def get_retriever(self, node_key: str):
		retriever = self.retrievers.get(node_key)
		if not retriever:
			raise ValueError(f"Node '{node_key}' not found.")

		return retriever
	
	def save_node(self, node_key: str):
		dir = os.path.join(self.base_dir, self.language, node_key, self.model.name)
		os.makedirs(dir, exist_ok=True)

		logger.debug(f"Saving FAISS node | model={self.model.name} | language={self.language} | node={node_key}")

		retriever = self.retrievers[node_key]
		retriever.save(dir)

	def save_all(self):
		for node in self.retrievers:
			self.save_node(node)

	def load_node(self, node_key: str):
		dir = os.path.join(self.base_dir, self.language, node_key, self.model.name)

		logger.debug(f"Loading FAISS node | model={self.model.name} | language={self.language} | node={node_key}")

		if not os.path.exists(dir):
			logger.warning("Node not found on disk.")
			return

		retriever = FaissRetriever.load(self.model, dir)

		self.retrievers[node_key] = retriever

		logger.success("Loaded node successfully.")

	def load_all(self):
		for lang in os.listdir(self.base_dir):
			if lang in self.language:
				lang_dir = os.path.join(self.base_dir, lang)
				for node in os.listdir(lang_dir):
					self.load_node(node)
