from controllers.encoders.jaccard import JaccardEncoder
from services.multilingual_manager import MultilingualManager
from controllers.hybrid import HybridRetriever, FusionMethod
from controllers.retrievers.faiss import FaissRetriever
from controllers.retrievers.dense import DenseRetriever
from controllers.retrievers.retriever import Retriever
from utils.vector_numpy import cosine_similarity
from schemas.similarity import SearchMethod
from typing import Optional

class SimilarityEngine:
    def __init__(self, manager: MultilingualManager):
        self.manager = manager

    def get_indexed_retriever(self, method: SearchMethod, language: str, node_key: str) -> FaissRetriever:
        node_engine = self.manager.get_node_engine(
            language=language,
            model_type=method,
        )
        return node_engine.get_retriever(node_key)
    
    def get_dense_retriever(self, method: SearchMethod, language: str) -> DenseRetriever:
        similarity_fn = cosine_similarity
        if method == SearchMethod.JACCARD:
            similarity_fn = JaccardEncoder.jaccard

        return self.manager.get_dense_retriever(
            language=language,
            model_type=method,
            similarity_fn=similarity_fn,
        )

    def get_retriever(self, method: SearchMethod, language: str, corpus: Optional[list[str]] = None, node_key: Optional[str] = None):
        if method == SearchMethod.SBERT:
            if not node_key:
                raise ValueError("node_key is required for SBERT")
            node_engine = self.manager.get_node_engine(
                language=language,
                model_type="sbert",
            )
            return node_engine.get_retriever(node_key)

        similarity_fn = cosine_similarity
        if method == SearchMethod.JACCARD:
            similarity_fn = JaccardEncoder.jaccard

        retriever = self.manager.get_dense_retriever(
            language=language,
            model_type=method,
            similarity_fn=similarity_fn,
        )
        
        if corpus is not None:
            retriever.fit(corpus)

        return retriever

    def search(self, query: str, method: SearchMethod, top_k: int, language: str, corpus: Optional[list[str]] = None, node_key: Optional[str] = None):
        if node_key is not None:
            retriever = self.get_indexed_retriever(
                method=method,
                language=language,
                node_key=node_key,
            )

        elif corpus is not None:
            retriever = self.get_dense_retriever(
                method=method,
                language=language,
            )
            retriever.fit(corpus)
        else:
            raise ValueError("Either corpus or node_key must be provided.")

        return retriever.search(query, top_k)

    def search_hybrid(self, query: str, methods: list[SearchMethod], top_k: int, language: str, corpus: list[str], node_key: Optional[str], weights: list[float]):
        if not methods:
            raise ValueError("method list cannot be empty.")

        retrievers: list[Retriever] = [
            self.get_retriever(method, language, corpus, node_key)
            for method in methods
        ]

        hybrid = HybridRetriever(
            retrievers=retrievers,
            weights=weights,
            fusion_method=FusionMethod.WEIGHTED,
        )

        hybrid.fit(corpus)
        return hybrid.search(query, top_k)
    