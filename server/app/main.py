from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers.inference import router
import uvicorn
from app.core.settings import get_settings
from app.services.similarity_engine import SimilarityEngine
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.load_models import (
	get_sentence_transformers, 
	get_word2vec, 
	get_bert_models, 
	get_trained_pipelines,
	get_siamese_lstm,
	LazyLoader
)

def load_models(lazy_loaders: dict[str, LazyLoader]):
	return {lang: loader.model for lang, loader in lazy_loaders.items()}

def create_similarity_engine():
	settings = get_settings()
	languages = settings.languages

	lazy_sentence_transformers = get_sentence_transformers(languages)
	lazy_word2vec = get_word2vec(languages)
	lazy_bert = get_bert_models(languages)
	lazy_nlps = get_trained_pipelines(languages)
	lazy_lstm = get_siamese_lstm(languages)

	sentence_transformers = load_models(lazy_sentence_transformers)
	word2vec = load_models(lazy_word2vec)
	bert_models = load_models(lazy_bert)
	nlps = load_models(lazy_nlps)
	siamese_lstm = load_models(lazy_lstm)

	similarity_engine = SimilarityEngine(
		word2vec=word2vec,
		sentence_transformers=sentence_transformers,
		bert_models=bert_models,
		nlps=nlps,
		siamese_lstm=siamese_lstm,
	)

	return similarity_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
	similarity_engine = create_similarity_engine()
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