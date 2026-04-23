from fastapi import APIRouter, Depends, HTTPException, Request
from schemas.similarity import (
	SimilarityRequest,
	SimilarityResponse,
	SimilarityMatch,
	FaissSimilarityRequest,
	HybridSimilarityRequest,
	HybridMatch
)
from services.similarity_engine import SimilarityEngine
from controllers.hybrid import FusionMethod
import numpy as np
import time
from loguru import logger

router = APIRouter(
	prefix="/similarity",
	tags=["similarity"],
)

def get_similarity_engine(request: Request):
	return request.state.similarity_engine

def build_similarity_response(indices: np.ndarray, scores: np.ndarray, texts: np.ndarray, elapsed: float):
    return SimilarityResponse(
        matches=[
            SimilarityMatch(
                index=int(idx),
                score=float(score),
                text=str(text),
            )
            for idx, score, text in zip(indices, scores, texts)
        ],
        processing_time=elapsed,
    )


def build_hybrid_response(indices: np.ndarray, scores: np.ndarray, texts: np.ndarray, sparse: np.ndarray, dense: np.ndarray, elapsed: float):
    return SimilarityResponse(
        matches=[
            HybridMatch(
                index=int(idx),
				score=float(score),
                sparse_score=float(sparse),
                dense_score=float(dense),
                text=str(text),
            )
            for idx, text, score, sparse, dense in zip(indices, texts, scores, sparse, dense)
        ],
        processing_time=elapsed,
    )

@router.post("/jaccard", response_model=SimilarityResponse)
def similarity_jaccard(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search_jaccard(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"jaccard endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/tfidf", response_model=SimilarityResponse)
def similarity_tfidf(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search_tf_idf(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"tfidf endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


# @router.post("/word2vec", response_model=SimilarityResponse)
# def similarity_word2vec(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
# 	start = time.perf_counter()
# 	try:
# 		top_indices, top_scores, top_texts = engine.search_word2vec(
# 			query=req.query,
# 			corpus=req.corpus,
# 			top_k=req.top_k,
# 			language=req.language,
# 			method=Word2VecMethod.POS,
# 		)
# 		elapsed = time.perf_counter() - start
# 		logger.debug(f"word2vec endpoint took {elapsed:.4f}s")
# 		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
# 	except ValueError as e:
# 		raise HTTPException(status_code=404, detail=str(e))


# @router.post("/lstm", response_model=SimilarityResponse)
# def similarity_lstm(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
# 	start = time.perf_counter()
# 	try:
# 		top_indices, top_scores, top_texts = engine.search_lstm(
# 			query=req.query,
# 			corpus=req.corpus,
# 			top_k=req.top_k,
# 			language=req.language,
# 		)
# 		elapsed = time.perf_counter() - start
# 		logger.debug(f"lstm endpoint took {elapsed:.4f}s")
# 		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
# 	except ValueError as e:
# 		raise HTTPException(status_code=404, detail=str(e))

# @router.post("/sbert", response_model=SimilarityResponse)
# def similarity_sbert(req: FaissSimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
# 	start = time.perf_counter()
# 	try:
# 		top_indices, top_scores, top_texts = engine.search_dense_vector_engine(
# 			query=req.query,
# 			top_k=req.top_k,
# 			language=req.language,
# 			model_name="sbert",
# 			node_key=req.node_key
# 		)
# 		elapsed = time.perf_counter() - start
# 		logger.debug(f"sbert endpoint took {elapsed:.4f}s")
# 		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
# 	except ValueError as e:
# 		raise HTTPException(status_code=404, detail=str(e))


@router.post("/sbert", response_model=SimilarityResponse)
def similarity_bert(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search_sbert(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"sbert endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
		
# @router.post("/hybrid", response_model=SimilarityResponse)
# def similarity_hybrid(req: HybridSimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
# 	start = time.perf_counter()
# 	try:
# 		top_indices, top_scores, top_texts, top_sparse, top_dense = engine.search_hybrid(
# 			query=req.query,
# 			corpus=req.corpus,
# 			top_k=req.top_k,
# 			language=req.language,
# 			model_name="sbert",
# 			node_key=req.node_key,
# 			fusion_method=FusionMethod.WEIGHTED
# 		)
# 		elapsed = time.perf_counter() - start
# 		logger.debug(f"hybrid endpoint took {elapsed:.4f}s")
# 		return build_hybrid_response(top_indices, top_scores, top_texts, top_sparse, top_dense, elapsed)
# 	except ValueError as e:
# 		raise HTTPException(status_code=404, detail=str(e))
	