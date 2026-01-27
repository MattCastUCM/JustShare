
from models import CorpusRequest, SimilarityRequest
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
import asyncio

load_dotenv()

from similarity_engine import SimilarityEngine

app = FastAPI()
similarity_engine = SimilarityEngine()

@app.put("/create_corpus/{corpus_id}")
def create_corpus(id: str, request: CorpusRequest):
    similarity_engine.create_corpus(id, request.texts)
    return {
        "corpus_id": id
    }

@app.post("/corpora/{corpus_id}/similarity")
async def similarity(corpus_id: str, request: SimilarityRequest):
    try:
        if request.method == "jaccard":
            return await run_in_threadpool(
                similarity_engine.similarity_jaccard,
                corpus_id,
                request.text
            )

        if request.method == "tfidf":
            return await run_in_threadpool(
                similarity_engine.similarity_tf_idf,
                corpus_id,
                request.text
            )

        if request.method == "word2vec":
            return await run_in_threadpool(
                similarity_engine.similarity_word2vec,
                corpus_id,
                request.text
            )

        if request.method == "embeddings":
            return await similarity_engine.similarity_embeddings(
                corpus_id,
                request.text
            )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

async def main():

    texts = [
        "¡Gracias! Si necesito algo, te aviso.",
        "Igualmente, un gusto conocerte *sonríes*.",
        "Ah, sí... ¡hola!",
        "Gracias, cualquier cosa te cuento.",
        "Perfecto, muchas gracias.",
        "Igualmente, encantado de conocerte.",
        "Encantado de conocerte también.",
        "El gusto es mío.",
        "Jaja, ¡hola!",
        "Ah, sí... hola.",
        "Perdón, me colgué un poco... hola.",
        "Hola, ¿qué tal?",
        "Hey, hola.",
        "Ah, cierto... hola.",
        "Todo bien, gracias.",
        "Mucho gusto.",
        "Encantado, un placer conocerte.",
        "Hola, hola.",
        "Ups... ¡hola!",
        "Ah, sí, perdón... hola."
    ]
    text = "hola, amiga, encantado de conocerte"
    similarity_engine.create_corpus(
        id = "1",
        texts=texts
    )
    best_match = similarity_engine.similarity_word2vec(
        "1", 
        text=text,
    )
    print(best_match)


if __name__ == "__main__":
    # _ = main()
    asyncio.run(main())
