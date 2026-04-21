from utils.vector_numpy import l2_normalize
from controllers.retriever import BaseRetriever
from typing import Callable
import numpy as np
import json
import pickle
import faiss
import time
import os
from loguru import logger

class FaissRetriever(BaseRetriever):
	"""
	FAISS-based dense retriever with multiple index types.

	Index types by use case:
	- Flat: Exact search, small datasets (<100K vectors)
	- IVF: Clustered search, medium datasets (100K-10M)
	- HNSW: Graph-based, best recall/speed trade-off
	- IVF-PQ: Compressed, large datasets (10M+)
	"""

	def __init__(self,
		model: Callable[[list[str]], np.ndarray],
		index_type: str = "flat",
		dimension: int = 384,
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
		self.model = model
		self.index_type = index_type
		self._needs_training = index_type in ["ivf", "ivf_pq"]

		# Build appropriate index
		if index_type == "flat":
			self.index = faiss.IndexFlatIP(dimension)  # Inner product (cosine for normalized)

		elif index_type == "ivf":
			quantizer = faiss.IndexFlatIP(dimension)
			self.index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
			self._needs_training = True

		elif index_type == "hnsw":
			self.index = faiss.IndexHNSWFlat(dimension, m)
			self.index.hnsw.efConstruction = ef_construction
			self.index.hnsw.efSearch = ef_search

		elif index_type == "ivf_pq":
			quantizer = faiss.IndexFlatIP(index_type)
			# PQ with 8 sub-quantizers, 8 bits each
			self.index = faiss.IndexIVFPQ(quantizer, dimension, nlist, 8, 8)
			self._needs_training = True

		else:
			raise ValueError(f"Unknown index type: {index_type}")

	def fit(self, corpus: list[str], language: str):
		"""Index documents."""
		embeddings = self.model(corpus)

		embeddings = np.asarray(embeddings).astype('float32')
		embeddings = l2_normalize(embeddings)

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

	def search(self, query: str, top_k: int=3):
		"""Search for similar documents."""
		query_embedding = self.model([query]).astype("float32")
		query_embedding = l2_normalize(query_embedding)
		
		scores, indices = self.index.search(query_embedding, top_k)

		idx_list: list[int] = []
		score_list: list[float] = []
		text_list: list[str] = []

		for idx, score in zip(indices[0], scores[0]):
			if idx >= 0:  # FAISS returns -1 for missing results
				meta = self.metadata[idx]

				idx_list.append(meta["index"])
				score_list.append(float(score))
				text_list.append(meta["text"])

		return (
			np.array(idx_list, dtype=np.int32),
			np.array(score_list, dtype=np.float32),
			np.array(text_list, dtype=object)
		)

	def benchmark(self, queries: list[str], top_k: int=5):
		"""Benchmark search performance."""
		times = []
		for query in queries:
			start = time.time()
			self.search(query, top_k)
			times.append(time.time() - start)

		return {
			"index_type": self.index_type,
			"num_vectors": self.index.ntotal,
			"avg_latency_ms": np.mean(times) * 1000,
			"p99_latency_ms": np.percentile(times, 99) * 1000,
			"queries_per_second": len(queries) / sum(times)
		}
	
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
	def load(cls, model: Callable[[list[str]], np.ndarray], dir: str):
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
			model=model
		)
		
		instance.index = index
		instance.metadata = metadata

		return instance
