from fastapi import APIRouter, Depends, HTTPException, Request
from schemas.similarity import (
	SimilarityRequest,
	SimilarityResponse,
	SimilarityMatch,
	FaissSimilarityRequest,
	HybridSimilarityRequest
)
from services.similarity_engine import SimilarityEngine
from controllers.transformer import PoolingMethod
from controllers.weighted_word2vec import Word2VecMethod
from controllers.hybrid import FusionMethod
import time
from loguru import logger

router = APIRouter(
	prefix="/similarity",
	tags=["similarity"],
)

def get_similarity_engine(request: Request):
	return request.state.similarity_engine

def build_similarity_response(method: str, idx_arr, score_arr, text_arr, start_time: float):
	elapsed = time.perf_counter() - start_time
	logger.debug(f"{method} endpoint took {elapsed:.4f} seconds.")
	
	matches = [
		SimilarityMatch(
			index=int(index),
			score=float(score),
			text=str(text)
		)
		for index, score, text in zip(idx_arr, score_arr, text_arr)
	]

	return SimilarityResponse(
		matches=matches,
		processing_time=elapsed,
	)

@router.post("/jaccard", response_model=SimilarityResponse)
def similarity_jaccard(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_jaccard(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("jaccard", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/tfidf", response_model=SimilarityResponse)
def similarity_tfidf(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_tf_idf(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("tfidf", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/word2vec", response_model=SimilarityResponse)
def similarity_word2vec(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_word2vec(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			method=Word2VecMethod.POS,
		)
		return build_similarity_response("word2vec", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/lstm", response_model=SimilarityResponse)
def similarity_lstm(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_lstm(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("lstm", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

@router.post("/sbert", response_model=SimilarityResponse)
def similarity_sbert(req: FaissSimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_dense_vector_engine(
			query=req.query,
			top_k=req.top_k,
			language=req.language,
			model_name="sbert",
			node_key=req.node_key
		)
		return build_similarity_response("sbert", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/bert", response_model=SimilarityResponse)
def similarity_bert(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_transformer(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			model_type="bert",
			pooling=PoolingMethod.MEAN,
		)
		return build_similarity_response("bert", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
		
@router.post("/hybrid", response_model=SimilarityResponse)
def similarity_hybrid(req: HybridSimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		idx_arr, score_arr, text_arr = engine.search_hybrid(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			model_name="sbert",
			node_key=req.node_key,
			fusion_method=FusionMethod.WEIGHTED
		)
		return build_similarity_response("hybrid", idx_arr, score_arr, text_arr, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
	