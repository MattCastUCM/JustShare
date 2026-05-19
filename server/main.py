from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.inference import router
from core.settings import get_settings
from fastapi.middleware.cors import CORSMiddleware
from services.similarity_engine import SimilarityEngine
from services.multilingual_manager import MultilingualManager
from services.encoder_factory import EncoderFactory
from services.calibrator_factory import CalibratorFactory
from services.model_registry import ModelRegistry
from core.settings import Settings
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
	base_dir = "./faiss_data"

	settings = Settings()
	languages = settings.languages

	model_registry = ModelRegistry(languages)
	# model_registry.build()
	model_registry.build_spacy()
	model_registry.build_tranformer("bert")
	model_registry.build_tranformer("sbert")
	# model_registry.build_word2vec()
	model_registry.build_lstm()
	model_registry.resolve_all()

	encoder_factory = EncoderFactory(model_registry)
	calibrator_factory = CalibratorFactory(model_registry)
	multilingual = MultilingualManager(encoder_factory, calibrator_factory, base_dir)
	# model_types = model_registry.active_model_types()

	multilingual.load_all_node_engines(languages, ["sbert"])

	similarity_engine = SimilarityEngine(multilingual)

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

LOCALIZATION_DIR = "./adaptation/localization"

STRUCTURE_DIR = os.path.join(LOCALIZATION_DIR, "structure")
FINAL_DIR = os.path.join(LOCALIZATION_DIR, "final")

app.mount(
    "/localization/structure",
    StaticFiles(directory=STRUCTURE_DIR),
    name="structure"
)

app.mount(
    "/localization",
    StaticFiles(directory=FINAL_DIR),
    name="localization"
)

app.include_router(router)

if __name__ == "__main__":
	uvicorn.run(
		"main:app",
		host=settings.host,
		port=settings.port,
		# reload=True
	)
