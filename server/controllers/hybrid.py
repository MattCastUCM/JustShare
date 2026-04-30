from controllers.retrievers.retriever import Retriever
from utils.vector_numpy import normalize
from enum import StrEnum
import numpy as np

class FusionMethod(StrEnum):
	RRF = "reciprocal_rank_fusion"
	WEIGHTED = "weighted_sum"

class HybridRetriever:
	"""
	Hybrid retrieval combining BM25 and dense embeddings.

	Why hybrid works:
	1. BM25 excels at exact keyword matching
	2. Dense excels at semantic similarity
	3. Combined catches what each misses alone

	Real-world improvement: 15-30% better recall than either alone
	"""

	def __init__(self, 
			retrievers: list[Retriever], 
			weights: list[float],
			fusion_method: FusionMethod = FusionMethod.RRF, 
			rrf_k: int = 60,
			retrieval_multiplier: int = 5, 
			min_retrieval_k: int = 20 
		):
		self.retrievers = retrievers
		self.fusion_method = fusion_method
		self.rrf_k = rrf_k

		self.weights = weights if weights else [1.0] * len(retrievers)

		if len(self.weights) != len(self.retrievers):
			raise ValueError("weights must match number of retrievers")

		self.retrieval_multiplier = retrieval_multiplier
		self.min_retrieval_k = min_retrieval_k
	
	def fit(self, corpus: list[str]):
		for retriever in self.retrievers:
			if not retriever.is_fitted():
				retriever.fit(corpus)
		return self

	def _reciprocal_rank_fusion(self, all_results: list[tuple[np.ndarray, np.ndarray, np.ndarray]], raw_score_maps: list[dict[int, float]], top_k: int):
		rrf_scores = {}
		text_map = {}

		for idxs, scores, texts in all_results:
			for rank, (idx, text) in enumerate(zip(idxs, texts)):
				rrf_scores[idx] = rrf_scores.get(idx, 0.0)
				rrf_scores[idx] += 1.0 / (self.rrf_k + rank + 1)

				if idx not in text_map:
					text_map[idx] = text

		indices = np.array(list(rrf_scores.keys()), dtype=np.int32)
		scores = np.array(list(rrf_scores.values()), dtype=np.float32)

		top_idx = np.argsort(-scores)[:top_k]

		top_indices = indices[top_idx]
		top_scores = scores[top_idx]

		top_texts = np.array(
			[text_map.get(i, "") for i in top_indices],
			dtype=object
		)

		raw_matrix = []
		for retr_idx in range(len(raw_score_maps)):
			retr_map = raw_score_maps[retr_idx]
			raw_matrix.append([
				retr_map.get(idx, 0.0) for idx in top_indices
			])

		return {
			"indices": top_indices,
			"scores": {
				"combined": top_scores,
				"raw_per_retriever": np.array(raw_matrix, dtype=np.float32),
			},
			"texts": top_texts
		}
	
	def _weighted_fusion(self, all_results: list[tuple[np.ndarray, np.ndarray, np.ndarray]], raw_score_maps: list[dict[int, float]], top_k: int):
		"""
		Weighted sum of normalized scores.

		Challenge: Different score scales (BM25: 0-20+, cosine: 0-1)
		Solution: Min-max normalization before combining
		"""
		all_indices = set()
		text_map = {}

		for (idxs, scores, texts) in all_results:
			all_indices.update(idxs)

		all_indices = np.array(sorted(all_indices))
		idx_map = {idx: i for i, idx in enumerate(all_indices)}

		combined = np.zeros(len(all_indices), dtype=np.float32)

		for retr_idx, (idxs, scores, texts) in enumerate(all_results):
			weight = self.weights[retr_idx]

			vec = np.zeros(len(all_indices), dtype=np.float32)

			for idx, score, text in zip(idxs, scores, texts):
				vec[idx_map[idx]] = score
				if idx not in text_map:
					text_map[idx] = text

			vec = normalize(vec)

			combined += weight * vec

		top_idx = np.argsort(-combined)[:top_k]

		top_indices = all_indices[top_idx]
		top_scores = combined[top_idx]

		top_texts = np.array(
			[text_map.get(i, "") for i in top_indices],
			dtype=object
		)

		raw_matrix = []
		for retr_idx in range(len(raw_score_maps)):
			retr_map = raw_score_maps[retr_idx]
			raw_matrix.append([
				retr_map.get(idx, 0.0) for idx in top_indices
			])

		return {
			"indices": top_indices,
			"scores": {
				"combined": top_scores,
				"raw_per_retriever": np.array(raw_matrix, dtype=np.float32),
			},
			"texts": top_texts
		}

	def search(self, query: str, top_k = 3):
		"""
		Hybrid search combining sparse and dense results.

		Args:
			query: Search query
			top_k: Final number of results
			retrieval_k: How many to retrieve from each method before fusion
		"""
		retrieval_k = max(top_k * self.retrieval_multiplier, self.min_retrieval_k)

		all_results = [
			r.search(query, retrieval_k)
			for r in self.retrievers
		]

		raw_score_maps: list[dict[int, float]] = []
		for (idxs, scores, _) in all_results:
			raw_score_maps.append({
				idx: score for idx, score in zip(idxs, scores)
			})

		if self.fusion_method == FusionMethod.RRF:
			# https://www.mongodb.com/resources/basics/reciprocal-rank-fusion
			return self._reciprocal_rank_fusion(all_results, raw_score_maps, top_k)
		else:
			return self._weighted_fusion(all_results, raw_score_maps, top_k)
		
