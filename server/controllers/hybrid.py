from typing import Literal
from controllers.retriever import BaseRetriever
from schemas.similarity import SimilarityMatch
from pydantic import BaseModel
import math

FusionMethod = Literal["reciprocal_rank_fusion"]

class HybridResult(BaseModel):
    index: int
    text: str
    sparse_score: float = 0.0
    dense_score: float = 0.0
    combined_score: float = 0.0
    sparse_rank: int = -1
    dense_rank: int = -1

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
            fusion_method: FusionMethod = "reciprocal_rank_fusion", 
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
        self.sigmoid_k = sigmoid_k
        self.retrieval_multiplier = retrieval_multiplier
        self.min_retrieval_k = min_retrieval_k

    def fit(self, corpus: list[str], language: str):
        """Index documents in both retrievers."""
        self.sparse.fit(corpus, language)
        self.dense.fit(corpus, language)
        return self
    
    def _sigmoid(self, x: float):
        k = self.sigmoid_k  # e.g. 8.0
        return 1 / (1 + math.exp(-k * x))

    def _reciprocal_rank_fusion(
        self,
        sparse_results: list[SimilarityMatch],
        dense_results: list[SimilarityMatch],
        top_k: int
    ):

        scores: dict[int, HybridResult] = {}

        # Sparse rankings
        for rank, match in enumerate(sparse_results):
            scores[match.index] = scores.get(match.index, HybridResult(index=match.index, text=match.text))
            scores[match.index].sparse_rank = rank + 1
            scores[match.index].sparse_score = match.score

        # Dense rankings
        for rank, match in enumerate(dense_results):
            if match.index not in scores:
                scores[match.index] = HybridResult(index=match.index, text=match.text)

            scores[match.index].dense_rank = rank + 1
            scores[match.index].dense_score = match.score

        # Compute RRF
        for item in scores.values():
            rrf_score = 0.0

            if item.sparse_rank > 0:
                rrf_score += 1 / (self.rrf_k + item.sparse_rank)

            if item.dense_rank > 0:
                rrf_score += 1 / (self.rrf_k + item.dense_rank)

            item.combined_score = rrf_score

        for item in scores.values():
            item.combined_score = self._sigmoid(item.combined_score)
        
        results = sorted(
            scores.values(),
            key=lambda x: x.combined_score,
            reverse=True
        )

        return results[:top_k]

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

        if self.fusion_method == "reciprocal_rank_fusion":
            fused_results = self._reciprocal_rank_fusion(sparse_results, dense_results, top_k)
            return [
                SimilarityMatch(
                    index=result.index,
                    score=result.combined_score,
                    text=result.text,
                )
                for result in fused_results
            ]
