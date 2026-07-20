from contextlib import asynccontextmanager
from fastapi import FastAPI
from routers.inference import router
from core.settings import get_settings
from schemas.similarity import SearchMethod
from fastapi.middleware.cors import CORSMiddleware
from services.similarity_engine import SimilarityEngine
from services.multilingual_manager import MultilingualManager
from services.encoder_factory import EncoderFactory
from services.calibrator_factory import CalibratorFactory
from services.model_registry import ModelRegistry, ModelType
from adaptation.misc import NameAnonymizer
from core.settings import Settings
from fastapi.staticfiles import StaticFiles
from spelling_checker.candidates import SymSpell
from spelling_checker.ngram_model import KNgramModel
from spelling_checker.corrections import SpellCorrector
from spylls.hunspell import Dictionary
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
	settings = Settings()
	languages = settings.languages

	# Se el cargador de modelos
	model_registry = ModelRegistry(languages)

	enabled_models = set(settings.models)

	# Se cargan los modelos deseados con el LazyLoader
	if enabled_models & {
		SearchMethod.JACCARD,
		SearchMethod.TFIDF,
		SearchMethod.WORD2VEC_IDF,
		SearchMethod.WORD2VEC_POS,
		SearchMethod.WORD2VEC_IDF_POS
	}:
		model_registry.build_spacy()

	model_builders = {
		SearchMethod.SBERT: lambda: model_registry.build_transformer(ModelType.SBERT),
		SearchMethod.LSTM: model_registry.build_lstm,
	}

	if enabled_models & {
		SearchMethod.WORD2VEC_IDF,
		SearchMethod.WORD2VEC_POS,
		SearchMethod.WORD2VEC_IDF_POS
	}:
		model_registry.build_word2vec()

	for method, builder in model_builders.items():
		if method in enabled_models:
			builder()
	
	# Se construyen todos los modelos porque en principio no hay inicialización vaga
	model_registry.resolve_all()

	# Se construyen las factorías con los encoders y con los calibradores (solo para LSTM)
	encoder_factory = EncoderFactory(model_registry)
	calibrator_factory = CalibratorFactory(model_registry)

	# Se carga el anonimizador de nombres
	name_anonymizer = NameAnonymizer(
		names_path=settings.spanish_names_path,
		whitelist_path=settings.name_whitelist_path,
		replacement="[UNK]"
	)

	ignored_tokens = {name_anonymizer.replacement, *name_anonymizer.whitelist}

	lexicon = Dictionary.from_files(settings.hunspell_dict_dir)
	sym_spell = SymSpell.load(settings.sym_spell_path)
	forward_lm = KNgramModel.load(settings.forward_lm_path)
	backward_lm = KNgramModel.load(settings.backward_lm_path)

	spell_corrector = SpellCorrector(
		lexicon=lexicon,
		candidate_gen=sym_spell,
		forward_lm=forward_lm,
		backward_lm=backward_lm,
		max_distance=settings.spell_max_distance,
		ignored_tokens=ignored_tokens
	)
	
	# Se construye el gestor plurilingue que permite cargar los diferentes retrievers 
	multilingual = MultilingualManager(
		encoder_factory=encoder_factory,
		calibrator_factory=calibrator_factory, 
		name_anonymizer=name_anonymizer,
		spell_corrector=spell_corrector,
		base_dir=settings.faiss_data_dir
	)

	indexed_models = enabled_models & {
		SearchMethod.TFIDF,
		SearchMethod.WORD2VEC_IDF,
		SearchMethod.WORD2VEC_POS,
		SearchMethod.SBERT,
		SearchMethod.LSTM,
	}

	# Se cargan todos los nodos para los tipos de modelos activos
	multilingual.load_all_node_engines(languages, indexed_models)

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

app.mount(
	"/localization/structure",
	StaticFiles(directory=settings.structure_dir),
	name="structure"
)

app.mount(
	"/localization",
	StaticFiles(directory=settings.language_dir),
	name="localization"
)

app.include_router(router)

if __name__ == "__main__":
	uvicorn.run(
		"main:app",
		host=settings.host,
		port=settings.port,
	)
