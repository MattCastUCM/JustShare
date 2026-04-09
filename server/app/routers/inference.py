from app.schemas.similarity import SimilarityRequest, SimilarityResponse, SimilarityMatch
from fastapi import APIRouter, Request, HTTPException
from app.services.similarity_engine import SimilarityEngine
from typing import cast
import time
from loguru import logger
import numpy as np

router = inference = APIRouter(
    prefix="/inference",
    tags=["inference"]
)

@router.post("/similarity", response_model=SimilarityResponse)
def similarity(req: SimilarityRequest, request: Request):
    start_time = time.perf_counter()

    similarity_engine = cast(SimilarityEngine, request.state.similarity_engine)

    try:
        match req.method:
            case "jaccard":
                scores = similarity_engine.similarity_jaccard(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language
                )

            case "tfidf":
                scores = similarity_engine.similarity_tf_idf(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language
                )

            case "word2vec":
                scores = similarity_engine.similarity_word2vec(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language,
                    method="pos"
                )

            case "sentence_transformers":
                scores = similarity_engine.similarity_transformer(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language,
                    model_type="sentence",
                    pooling="mean"
                )

            case "bert":
                scores = similarity_engine.similarity_transformer(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language,
                    model_type="bert",
                    pooling="mean"
                )
            
            case "siamese_lstm":
                scores = similarity_engine.similarity_lstm(
                    corpus=req.corpus,
                    text=req.text,
                    language=req.language,
                )
        
        top_indexes = np.argsort(-scores)[:req.top_k]

        matches = [
            SimilarityMatch(
                index=int(index),
                score=float(scores[index]),
                text=req.corpus[index]
            )
            for index in top_indexes
        ]

        elapsed = time.perf_counter() - start_time
        logger.debug(f"Similarity endpoint took {elapsed:.4f} seconds.")

        return SimilarityResponse(
            method=req.method,
            matches=matches,
            processing_time=elapsed,
            corpus_size=len(req.corpus)
        )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))