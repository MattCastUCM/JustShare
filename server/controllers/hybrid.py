from controllers.retriever import BaseRetriever
from schemas.similarity import SimilarityMatch
from pydantic import BaseModel
from enum import StrEnum
from utils.vector_numpy import sigmoid, normalize
import numpy as np

class FusionMethod(StrEnum):
	RRF = "reciprocal_rank_fusion"
	WEIGHTED = "weighted_sum"

class HybridRetriever(BaseRetriever):
	"""
	Hybrid retrieval combining BM25 and dense embeddings.

	Why hybrid works:
	1. BM25 excels at exact keyword matching
	2. Dense excels at semantic similarity
	3. Combined catches what each misses alone

	Real-world improvement: 15-30% better recall than either alone
	"""

	def __init__(self, 
			sparse: BaseRetriever, 
			dense: BaseRetriever, 
			fusion_method: FusionMethod = FusionMethod.RRF, 
			sparse_weight: float = 0.5,
			rrf_k: int = 60,
			sigmoid_k: float = 8.0,
			retrieval_multiplier: int = 5, 
			min_retrieval_k: int = 20 
		):
		"""
		Args:
			embedding_fn: Text to vector function
			fusion_method: How to combine scores
			sparse_weight: Weight for sparse scores (dense = 1 - sparse)
			rrf_k: RRF smoothing constant (60 is standard)
		"""
		self.sparse = sparse
		self.dense = dense
		self.fusion_method = fusion_method
		self.rrf_k = rrf_k
		self.sparse_weight = sparse_weight
		self.dense_weight = 1 - sparse_weight
		self.sigmoid_k = sigmoid_k
		self.retrieval_multiplier = retrieval_multiplier
		self.min_retrieval_k = min_retrieval_k

	def fit(self, corpus: list[str], language: str):
		"""Index documents in both retrievers."""
		self.sparse.fit(corpus, language)
		self.dense.fit(corpus, language)
		return self
	
	def _reciprocal_rank_fusion(
		self,
		sparse_results,
		dense_results,
		top_k: int
	):

		s_idx, _, s_texts = sparse_results
		d_idx, _, d_texts = dense_results

		rrf_scores = {}
		for rank, idx in enumerate(s_idx):
			rrf_scores[idx] = rrf_scores.get(idx, 0.0)
			rrf_scores[idx] += 1.0 / (self.rrf_k + rank + 1)

		for rank, idx in enumerate(d_idx):
			rrf_scores[idx] = rrf_scores.get(idx, 0.0)
			rrf_scores[idx] += 1.0 / (self.rrf_k + rank + 1)
		
		indices = np.array(list(rrf_scores.keys()), dtype=np.int32)
		scores = np.array(list(rrf_scores.values()), dtype=np.float32)

		scores = sigmoid(scores, self.sigmoid_k)

		top_k_idx = np.argsort(-scores)[:top_k]

		top_indices = indices[top_k_idx]
		top_scores = scores[top_k_idx]

		index_to_text = {}
		for i, idx in enumerate(s_idx):
			index_to_text[idx] = s_texts[i]

		for i, idx in enumerate(d_idx):
			if idx not in index_to_text:
				index_to_text[idx] = d_texts[i]

		top_texts = np.array(
			[index_to_text.get(idx, "") for idx in top_indices],
			dtype=object
		)

		return top_indices, top_scores, top_texts
	
	def _weighted_fusion(
		self,
		sparse_results,
		dense_results,
		top_k: int
	):
		"""
		Weighted sum of normalized scores.

		Challenge: Different score scales (BM25: 0-20+, cosine: 0-1)
		Solution: Min-max normalization before combining
		"""
		s_idx, s_scores, s_texts = sparse_results
		d_idx, d_scores, d_texts = dense_results

		all_indices = np.unique(np.concatenate([s_idx, d_idx]))
		idx_map = {idx: i for i, idx in enumerate(all_indices)}

		n = len(all_indices)

		sparse_vec = np.zeros(n, dtype=np.float32)
		dense_vec = np.zeros(n, dtype=np.float32)

		index_to_text = {}
		for i, idx in enumerate(s_idx):
			sparse_vec[idx_map[idx]] = s_scores[i]
			index_to_text[idx] = s_texts[i]
		
		for i, idx in enumerate(d_idx):
			dense_vec[idx_map[idx]] = d_scores[i]
			if idx not in index_to_text:
				index_to_text[idx] = d_texts[i]
		
		sparse_norm = normalize(sparse_vec)
		dense_norm = normalize(dense_vec)

		combined = self.sparse_weight * sparse_norm + self.dense_weight * dense_norm

		topk_idx = np.argsort(-combined)[:top_k]

		top_indices = all_indices[topk_idx]
		top_scores = combined[topk_idx].astype(np.float32)

		top_texts = np.array(
			[index_to_text.get(idx, "") for idx in top_indices],
			dtype=object
		)

		return top_indices, top_scores, top_texts

	def search(self, query: str, top_k: int=3):
		"""
		Hybrid search combining sparse and dense results.

		Args:
			query: Search query
			top_k: Final number of results
			retrieval_k: How many to retrieve from each method before fusion
		"""
		retrieval_k = max(top_k * self.retrieval_multiplier, self.min_retrieval_k)

		sparse_results = self.sparse.search(query, top_k=retrieval_k)
		dense_results = self.dense.search(query, top_k=retrieval_k)

		if self.fusion_method == FusionMethod.RRF:
			return self._reciprocal_rank_fusion(sparse_results, dense_results, top_k)
		else:
			return self._weighted_fusion(sparse_results, dense_results, top_k)
		
