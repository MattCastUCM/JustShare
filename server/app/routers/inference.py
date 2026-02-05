from app.schemas.similarity import SimilarityRequest, SimilarityResponse
from fastapi import APIRouter, Request, HTTPException
from app.services.similarity_engine import SimilarityEngine
from typing import cast
from fastapi.concurrency import run_in_threadpool

router = inference = APIRouter(
    prefix="/inference",
    tags=["inference"]
)

@router.post("/similarity", response_model=SimilarityResponse)
async def similarity(req: SimilarityRequest, request: Request):
    print(req)
    similarity_engine = cast(SimilarityEngine, request.state.similarity_engine)
    try:
        if req.method == "jaccard":
            return await run_in_threadpool(
                similarity_engine.similarity_jaccard,
                req.corpus,
                req.text,
                req.language
            )

        if req.method == "tfidf":
            return await run_in_threadpool(
                similarity_engine.similarity_tf_idf,
                req.corpus,
                req.text,
                req.language
            )

        if req.method == "word2vec":
            return await run_in_threadpool(
                similarity_engine.similarity_word2vec,
                req.corpus,
                req.text,
                req.language
            )

        if req.method == "embeddings":
            return await similarity_engine.similarity_embeddings(
                req.corpus,
                req.text
            )
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))