
from models import CorpusRequest, SimilarityRequest
from dotenv import load_dotenv
import asyncio

load_dotenv()

from similarity_engine import SimilarityEngine

async def main():
    similarity_engine = SimilarityEngine()

    texts = [
        "Gracias, si necesito algo ya te voy a decir.",
        "Igualmente, encantado de conocerte *sonríes*.",
        "... Ah, sí, holaaaa."
    ]
    text = "mira, me caes fatal, vete a la mierda absoluta"
    similarity_engine.create_corpus(
        CorpusRequest(
            id = "1",
            texts=texts
        )
    )
    best_match = similarity_engine.similarity_word2vec(
        "1", SimilarityRequest(
            text=text,
        )
    )
    print(best_match)


if __name__ == "__main__":
    # _ = main()
    asyncio.run(main())
