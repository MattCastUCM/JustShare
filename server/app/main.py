from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from app.routers.inference import router
import uvicorn
from app.core.settings import get_settings
import nltk
from app.models.load_models import get_embedding_model, get_word2vec_models, get_trained_pipelines
from app.services.similarity_engine import SimilarityEngine
from fastapi.middleware.cors import CORSMiddleware

def create_similarity_engine(max_n: int):
	nltk.download("punkt", quiet=True)
	nltk.download("stopwords", quiet=True)

	settings = get_settings()
	
	embedding_model = get_embedding_model(settings.embedding_model)
	word2vec_models = get_word2vec_models(settings.languages)
	spacy_models = get_trained_pipelines(settings.languages)

	similarity_engine = SimilarityEngine(
		word2vec_models=word2vec_models,
		embedding_model=embedding_model,
		spacy_models=spacy_models,
		max_n=max_n
	)

	return similarity_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
	similarity_engine = create_similarity_engine(max_n=2)
	yield {
		"similarity_engine": similarity_engine
	}

app = FastAPI(title="Inference Server", lifespan=lifespan)

origins = [
	"http://localhost:8080"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

async def main():
	similarity_engine = create_similarity_engine(max_n=2)

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
	best_match = similarity_engine.similarity_word2vec(
		corpus=texts, 
		text=text,
		language="es"
	)
	print(best_match)


if __name__ == "__main__":
	uvicorn.run(app, host="0.0.0.0", port=8000)
	# asyncio.run(main())
