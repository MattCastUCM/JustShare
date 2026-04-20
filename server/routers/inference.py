from fastapi import APIRouter, Depends, HTTPException, Request
from schemas.similarity import (
	SimilarityRequest,
	SimilarityResponse,
	SimilarityMatch,
	DenseSimilarityRequest
)
from services.similarity_engine import SimilarityEngine
import time
from loguru import logger

router = APIRouter(
	prefix="/similarity",
	tags=["similarity"],
)

def get_similarity_engine(request: Request):
	return request.state.similarity_engine

def build_similarity_response(method: str, results: list[SimilarityMatch], start_time: float):
	elapsed = time.perf_counter() - start_time
	logger.debug(f"{method} endpoint took {elapsed:.4f} seconds.")

	return SimilarityResponse(
		matches=results,
		processing_time=elapsed,
	)

@router.post("/jaccard", response_model=SimilarityResponse)
def similarity_jaccard(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_jaccard(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("jaccard", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/tfidf", response_model=SimilarityResponse)
def similarity_tfidf(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_tf_idf(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("tfidf", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/word2vec", response_model=SimilarityResponse)
def similarity_word2vec(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_word2vec(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			method="pos",
		)
		return build_similarity_response("word2vec", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/lstm", response_model=SimilarityResponse)
def similarity_lstm(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_lstm(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
		)
		return build_similarity_response("lstm", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

# @router.post("/sbert", response_model=SimilarityResponse)
# def similarity_sbert(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
#     start = time.perf_counter()
#     try:
#         results = engine.search_transformer(
#             query=req.query,
#             corpus=req.corpus,
#             top_k=req.top_k,
#             language=req.language,
#             model_type="sbert",
#             pooling="mean",
#         )
#         return build_similarity_response("sbert", results, req, start)
#     except ValueError as e:
#         raise HTTPException(status_code=404, detail=str(e))

@router.post("/sbert", response_model=SimilarityResponse)
def similarity_sbert(req: DenseSimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_dense_vector_engine(
			query=req.query,
			top_k=req.top_k,
			language=req.language,
			model_name="sbert",
			node_key=req.node_key
		)
		return build_similarity_response("sbert", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/bert", response_model=SimilarityResponse)
def similarity_bert(req: SimilarityRequest, engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_transformer(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			model_type="bert",
			pooling="mean",
		)
		return build_similarity_response("bert", results, start)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))
	