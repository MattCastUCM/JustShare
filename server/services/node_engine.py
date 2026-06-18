from controllers.retrievers.faiss import FaissRetriever
from controllers.encoders.encoder import Encoder
from adaptation.misc import NameAnonymizer
from .calibrator_factory import Calibrator
from loguru import logger
from typing import Optional
import os

class NodeEngine:
	def __init__(self, encoder: Encoder, base_dir: str, language: str, name_anonymizer: NameAnonymizer, calibrator: Optional[Calibrator]):
		self.model = encoder
		self.base_dir = base_dir
		self.language = language
		self.name_anonymizer = name_anonymizer
		self.calibrator = calibrator

		self.retrievers: dict[str, FaissRetriever] = {}
		os.makedirs(self.base_dir, exist_ok=True)

	def build_node(self, node_key: str, corpus: list[str], index_type: str = "flat"):
		retriever = FaissRetriever(
			encoder=self.model,
			name_anonymizer=self.name_anonymizer,
			index_type=index_type,
			calibrator=self.calibrator
		)
		retriever.fit(corpus)
		
		self.retrievers[node_key] = retriever

		return retriever

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

		retriever = FaissRetriever.load(
			encoder=self.model, 
			dir=dir,
			name_anonymizer=self.name_anonymizer,
			calibrator=self.calibrator
		)

		self.retrievers[node_key] = retriever

		logger.success("Loaded node successfully.")

	def load_all(self):
		for lang in os.listdir(self.base_dir):
			if lang in self.language:
				lang_dir = os.path.join(self.base_dir, lang)
				for node in os.listdir(lang_dir):
					self.load_node(node)
