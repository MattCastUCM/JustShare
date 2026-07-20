from controllers.retrievers.retriever import Retriever
from controllers.encoders.encoder import Encoder
from services.calibrator_factory import Calibrator
from adaptation.misc import NameAnonymizer
from spelling_checker.corrections import SpellCorrector
from typing import Optional
import numpy as np
import json
import pickle
import faiss
import os
from loguru import logger

class FaissRetriever(Retriever):
	"""
	FAISS-based dense retriever with multiple index types.

	Index types by use case:
	- Flat: Exact search, small datasets (<100K vectors)
	- IVF: Clustered search, medium datasets (100K-10M)
	- HNSW: Graph-based, best recall/speed trade-off
	- IVF-PQ: Compressed, large datasets (10M+)
	"""

	def __init__(self,
		encoder: Encoder, 
		name_anonymizer: Optional[NameAnonymizer] = None,
		spell_corrector: Optional[SpellCorrector] = None,
		calibrator: Optional[Calibrator] = None,
		index_type: str = "flat",
		nlist: int = 100,  # Number of clusters for IVF
		m: int = 32,       # HNSW connections per layer
		ef_construction: int = 200,  # HNSW build quality
		ef_search: int = 50  # HNSW search quality	
	):
		"""
		Args:
			embedding_fn: Function to convert text to vectors
			index_type: "flat", "ivf", "hnsw", or "ivf_pq"
			dimension: Embedding dimension
			nlist: IVF cluster count (sqrt(N) is good starting point)
			m: HNSW connections (16-64 typical)
			ef_construction: HNSW build parameter (higher = better quality, slower build)
			ef_search: HNSW search parameter (higher = better recall, slower search)
		"""
		super().__init__(encoder, name_anonymizer, spell_corrector, calibrator)
		self.index_type = index_type
		self.nlist = nlist
		self.m = m
		self.ef_construction = ef_construction
		self.ef_search = ef_search

		self.index = None
		self._needs_training = index_type in ["ivf", "ivf_pq"]

	def _build_index(self, dimension: int):
		# Build appropriate index
		if self.index_type == "flat":
			return faiss.IndexFlatIP(dimension)  # Inner product (cosine for normalized)

		elif self.index_type == "ivf":
			quantizer = faiss.IndexFlatIP(dimension)
			return faiss.IndexIVFFlat(quantizer, dimension, self.nlist)

		elif self.index_type == "hnsw":
			index = faiss.IndexHNSWFlat(dimension, self.m)
			index.hnsw.efConstruction = self.ef_construction
			index.hnsw.efSearch = self.ef_search
			return index

		elif self.index_type == "ivf_pq":
			quantizer = faiss.IndexFlatIP(dimension)
			# PQ with 8 sub-quantizers, 8 bits each
			return faiss.IndexIVFPQ(quantizer, dimension, self.nlist, 8, 8)
		
		else:
			raise ValueError(f"Unknown index type: {self.index_type}")

	def _fit(self, corpus: list[str]):
		"""Index documents."""
		self.encoder.fit(corpus)
		embeddings = self.encoder.transform(corpus, normalize=True)

		embeddings = np.asarray(embeddings, dtype=np.float32)

		dim = embeddings.shape[1]

		self.index = self._build_index(dim)

		# Train if needed (IVF indexes)
		if self._needs_training and not self.index.is_trained:
			logger.debug(f"Training {self.index_type} index on {len(embeddings)} vectors...")
			self.index.train(embeddings)

		# Add vectors
		self.index.add(embeddings)

		logger.debug(f"Indexed {self.index.ntotal} vectors")

		self.metadata = [
			{
				"text": text,
				"index": i
			}
			for i, text in enumerate(corpus)
		]

		return self
	
	def add_metadata(self, metadata: list[dict]):
		if len(metadata) != self.index.ntotal:
			raise ValueError(
				f"Metadata size ({len(metadata)}) must match index size ({self.index.ntotal})"
			)

		self.metadata = metadata

	def _search(self, query: str, top_k: int):
		"""Search for similar documents."""
		query_embedding = self.encoder.transform([query])
		query_embedding = np.asarray(query_embedding, dtype=np.float32)

		print(query_embedding.shape[1])
		print(self.index.d)
		
		faiss_scores, faiss_indices = self.index.search(query_embedding, top_k)

		idxs, scores, texts = [], [], []

		for idx, score in zip(faiss_indices[0], faiss_scores[0]):
			if idx >= 0:  # FAISS returns -1 for missing results
				meta = self.metadata[idx]
				
				idxs.append(meta["index"])
				scores.append(float(score))
				texts.append(meta["text"])

		return (
			np.array(idxs, dtype=np.int32),
			np.array(scores, dtype=np.float32),
			np.array(texts, dtype=object)
		)
	
	def save(self, dir: str):
		index_path = os.path.join(dir, "index.bin")
		faiss.write_index(self.index, index_path)

		metadata_path = os.path.join(dir, "metadata.pkl")
		with open(metadata_path, "wb") as f:
			pickle.dump(self.metadata, f)

		metadata_path = os.path.join(dir, "metadata.json")
		with open(metadata_path, "w", encoding="utf-8") as f:
			json.dump(self.metadata, f, ensure_ascii=False, indent=4)
			
	@classmethod
	def load(cls, encoder: Encoder, dir: str, name_anonymizer: Optional[NameAnonymizer] = None, spell_corrector: Optional[SpellCorrector] = None, calibrator: Optional[Calibrator] = None):
		index_path = os.path.join(dir, "index.bin")
		metadata_path = os.path.join(dir, "metadata.pkl")

		if not os.path.exists(index_path):
			raise FileNotFoundError(index_path)

		if not os.path.exists(metadata_path):
			raise FileNotFoundError(metadata_path)

		index = faiss.read_index(index_path)

		with open(metadata_path, "rb") as f:
			metadata = pickle.load(f)

		instance = cls(
			encoder=encoder,
			name_anonymizer=name_anonymizer,
			spell_corrector=spell_corrector,
			calibrator=calibrator
		)

		corpus = [item["text"] for item in metadata]
		instance.encoder.fit(corpus)
		
		instance.index = index
		instance.metadata = metadata
		instance.fitted = True

		return instance
