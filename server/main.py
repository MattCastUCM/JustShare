from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.inference import router
from core.settings import get_settings, ModelType
from fastapi.middleware.cors import CORSMiddleware
from services.similarity_engine import SimilarityEngine
from services.multilingual_manager import MultilingualManager
from services.encoder_factory import EncoderFactory
from services.calibrator_factory import CalibratorFactory
from services.model_registry import ModelRegistry
from adaptation.misc import NameAnonymizer
from core.settings import Settings
from fastapi.staticfiles import StaticFiles
import uvicorn
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
	settings = Settings()
	languages = settings.languages

	# Se el cargador de modelos
	model_registry = ModelRegistry(languages)

	# Se cargan los modelos deseados con el LazyLoader 
	if ModelType.SPACY in settings.models:
		model_registry.build_spacy()

	if ModelType.SBERT in settings.models:
		model_registry.build_transformer("sbert")

	if ModelType.WORD2VEC in settings.models:
		model_registry.build_word2vec()

	if ModelType.SIAMESE_LSTM in settings.models:
		model_registry.build_lstm()
	
	# Se construyen todos los modelos porque en principio no hay inicialización vaga
	model_registry.resolve_all()

	# Se construyen las factorías con los encoders y con los calibradores (solo para LSTM)
	encoder_factory = EncoderFactory(model_registry)
	calibrator_factory = CalibratorFactory(model_registry)

	# Se carga el anonimizador de nombres
	name_whitelist_path = os.path.join(settings.adaptation_data_dir, "name_whitelist.txt")
	spanish_names_path = os.path.join(settings.adaptation_data_dir, "nombres-propios-es.txt")

	name_anonymizer = NameAnonymizer(
		names_path=spanish_names_path,
		whitelist_path=name_whitelist_path,
		replacement="[UNK]"
	)
	
	# Se construye el gestor plurilingue que permite cargar los diferentes retrievers 
	multilingual = MultilingualManager(
		encoder_factory=encoder_factory,
		calibrator_factory=calibrator_factory, 
		name_anonymizer=name_anonymizer,
		base_dir=settings.faiss_data_dir
	)
	model_types = model_registry.active_model_types()

	# Se cargan todos los nodos para los tipos de modelos activos
	multilingual.load_all_node_engines(languages, model_types)

	# Se crea el gestor de similitudes de alto nivel
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

structure_dir = os.path.join(settings.localization_dir, "structure", "modified")
language_dir = os.path.join(settings.localization_dir, "dialogue", "active")

app.mount(
    "/localization/structure",
    StaticFiles(directory=structure_dir),
    name="structure"
)

app.mount(
    "/localization",
    StaticFiles(directory=language_dir),
    name="localization"
)

app.include_router(router)

if __name__ == "__main__":
	uvicorn.run(
		"main:app",
		host=settings.host,
		port=settings.port,
	)
