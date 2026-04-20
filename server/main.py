from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.inference import router
import uvicorn
from core.settings import get_settings
from services.similarity_engine import SimilarityEngine
from fastapi.middleware.cors import CORSMiddleware
from services.dense_vector_engine import DenseVectorEngine
from controllers.transformer import Transformer
from controllers.load_models import (
	get_sberts, 
	get_word2vecs, 
	get_berts, 
	get_nlps,
	get_siamese_lstms,
	resolve_models
)

def load_models(languages):
	return {
		"sberts": resolve_models(get_sberts(languages)),
		"word2vecs": resolve_models(get_word2vecs(languages)),
		"berts": resolve_models(get_berts(languages)),
		"nlps": resolve_models(get_nlps(languages)),
		"lstms": resolve_models(get_siamese_lstms(languages)),
	}

def build_similarity_engine(models: dict, engines: dict[str, DenseVectorEngine]):
	return SimilarityEngine(
		word2vecs=models["word2vecs"],
		sberts=models["sberts"],
		berts=models["berts"],
		nlps=models["nlps"],
		lstms=models["lstms"],
		engines=engines
	)

def build_dense_vector_engines(models: dict, base_dir: str, languages: set[str]):
	def build_transformer_encoders(transformers: dict[str, Transformer]):
		return {
			lang: (lambda sentences, model=transformer: model.encode(sentences, "mean"))
			for lang, transformer in transformers.items()
		}

	engines = []

	sbert_models = build_transformer_encoders(models["sberts"])
	engines.append(DenseVectorEngine(sbert_models, "sbert", base_dir))

	engines = {engine.model_name: engine for engine in engines}

	for engine in engines.values():
		engine.load_all(languages)

	return engines

def create_similarity_engine(base_dir):
	settings = get_settings()
	languages = settings.languages

	models = load_models(languages)

	engines = build_dense_vector_engines(models, base_dir, languages)
	similarity_engine = build_similarity_engine(models, engines)

	return similarity_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
	base_dir = "./faiss_data"
	similarity_engine = create_similarity_engine(base_dir)
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
		"main:app",
		host=settings.host,
		port=settings.port,
		# reload=True
	)
