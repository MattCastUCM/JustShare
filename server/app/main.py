from contextlib import asynccontextmanager
from fastapi import FastAPI
from .routers.inference import router
import uvicorn
from .core.settings import get_settings
from .models.load_models import get_sentence_transformers, get_word2vec, get_bert_models, get_trained_pipelines
from .services.similarity_engine import SimilarityEngine
from fastapi.middleware.cors import CORSMiddleware

def create_similarity_engine(max_n: int):
	settings = get_settings()
	languages = settings.languages
	
	lazy_sentence_transformers = get_sentence_transformers(languages)
	lazy_word2vec = get_word2vec(languages)
	lazy_bert = get_bert_models(languages)
	lazy_nlps = get_trained_pipelines(languages)
	
	sentence_transformers = {lang: loader.model for lang, loader in lazy_sentence_transformers.items()}
	word2vec = {lang: loader.model for lang, loader in lazy_word2vec.items()}
	bert_models = {lang: loader.model for lang, loader in lazy_bert.items()}
	nlps = {lang: loader.model for lang, loader in lazy_nlps.items()}

	similarity_engine = SimilarityEngine(
		word2vec=word2vec,
		sentence_transformers=sentence_transformers,
		bert_models=bert_models,
		nlps=nlps,
		max_n=max_n
	)

	return similarity_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
	similarity_engine = create_similarity_engine(max_n=2)
	yield {
		"similarity_engine": similarity_engine
	}

settings = get_settings()

app = FastAPI(title="Inference Server", lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=settings.allow_origins,
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
	uvicorn.run(
		"app.main:app",
		host=settings.host,
		port=settings.port,
	)
