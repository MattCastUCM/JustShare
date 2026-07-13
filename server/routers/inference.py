from fastapi import APIRouter, Depends, HTTPException, Request
from schemas.similarity import (
	SimilarityRequest,
	BaseSimilarityRequest,
	SimilarityResponse,
	SimilarityMatch,
	FaissSimilarityRequest,
	HybridSimilarityRequest,
	SearchMethod,
	SimilarityScore
)
from services.similarity_engine import SimilarityEngine
import numpy as np
import time
from loguru import logger
from core.settings import get_settings

router = APIRouter(
	prefix="/similarity",
	tags=["similarity"],
)

def validate_language(req: BaseSimilarityRequest):
    settings = get_settings()

    if req.language not in settings.languages:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language '{req.language}'. Supported languages: {sorted(settings.languages)}",
        )

    return req

def get_similarity_engine(request: Request):
	return request.state.similarity_engine

def build_similarity_response(indices: np.ndarray, scores: np.ndarray, texts: np.ndarray, elapsed: float, method: SearchMethod):
	return SimilarityResponse(
		matches=[
			SimilarityMatch(
				index=int(idx),
				scores={
					method: SimilarityScore(
						value=score,
					)
				},
				text=str(text),
			)
			for idx, score, text in zip(indices, scores, texts)
		],
		processing_time=elapsed,
	)

@router.post("/jaccard", response_model=SimilarityResponse)
def similarity_jaccard(req: SimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search(
			query=req.query,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			method=SearchMethod.JACCARD
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"jaccard endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed, SearchMethod.JACCARD)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))


@router.post("/tfidf", response_model=SimilarityResponse)
def similarity_tfidf(req: FaissSimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search(
			query=req.query,
			node_key=req.node_key,
			top_k=req.top_k,
			language=req.language,
			method=SearchMethod.TFIDF
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"tfidf endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed, SearchMethod.TFIDF)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

@router.post("/word2vec", response_model=SimilarityResponse)
def similarity_word2vec(req: FaissSimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search(
			query=req.query,
			node_key=req.node_key,
			top_k=req.top_k,
			language=req.language,
			method=SearchMethod.WORD2VEC
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"word2vec endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed, SearchMethod.WORD2VEC)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

@router.post("/lstm", response_model=SimilarityResponse)
def similarity_lstm(req: FaissSimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search(
			query=req.query,
			node_key=req.node_key,
			top_k=req.top_k,
			language=req.language,
			method=SearchMethod.LSTM
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"lstm endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed, SearchMethod.LSTM)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

@router.post("/sbert", response_model=SimilarityResponse)
def similarity_sbert(req: FaissSimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		top_indices, top_scores, top_texts = engine.search(
			query=req.query,
			node_key=req.node_key,
			top_k=req.top_k,
			language=req.language,
			method=SearchMethod.SBERT
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"sbert endpoint took {elapsed:.4f}s")
		return build_similarity_response(top_indices, top_scores, top_texts, elapsed, SearchMethod.SBERT)
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))

@router.post("/hybrid", response_model=SimilarityResponse)
def similarity_hybrid(req: HybridSimilarityRequest = Depends(validate_language), engine: SimilarityEngine = Depends(get_similarity_engine)):
	start = time.perf_counter()
	try:
		results = engine.search_hybrid(
			query=req.query,
			node_key=req.node_key,
			corpus=req.corpus,
			top_k=req.top_k,
			language=req.language,
			methods=req.methods,
			weights=req.weights
		)
		elapsed = time.perf_counter() - start
		logger.debug(f"hybrid [{req.methods}] endpoint took {elapsed:.4f}s")

		indices = results["indices"]
		scores = results["scores"]
		texts = results["texts"]

		combined = scores["combined"]
		raw = scores["raw_per_retriever"]
		
		matches = []

		for i in range(len(indices)):
			method_scores: dict[str, SimilarityScore] = {}
			for j, method in enumerate(req.methods):
				method_scores[method] = SimilarityScore(
					value=float(raw[j][i]),
					weight=req.weights[j]
				)
			method_scores["combined"] = SimilarityScore(
				value=float(combined[i])
			)

			matches.append(
				SimilarityMatch(
					index=int(indices[i]),
					scores=method_scores,
					text=str(texts[i]),
				)
			)

		return SimilarityResponse(
			matches=matches,
			processing_time=elapsed,
		)
	
	except ValueError as e:
		raise HTTPException(status_code=404, detail=str(e))