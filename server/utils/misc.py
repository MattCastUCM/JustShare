from services.similarity_engine import SimilarityEngine
from services.dense_vector_engine import DenseVectorEngine
from controllers.transformer import Transformer, PoolingMethod
from core.settings import get_settings
from typing import Optional
from controllers.load_models import (
	get_sberts, 
	get_word2vecs, 
	get_berts, 
	get_nlps,
	get_siamese_lstms,
	resolve_models
)

def load_models(languages, selected_models: Optional[set[str]] = None):
	selected_models = selected_models or {
		"sbert",
		"word2vec",
		"bert",
		"nlp",
		"lstm",
	}

	models = {}

	if "sbert" in selected_models:
		models["sbert"] = resolve_models(get_sberts(languages))

	if "word2vec" in selected_models:
		models["word2vec"] = resolve_models(get_word2vecs(languages))

	if "bert" in selected_models:
		models["bert"] = resolve_models(get_berts(languages))

	if "nlp" in selected_models:
		models["nlp"] = resolve_models(get_nlps(languages))

	if "lstm" in selected_models:
		models["lstm"] = resolve_models(get_siamese_lstms(languages))

	return models

def build_dense_vector_engines(models: dict, base_dir: str):
	def build_transformer_encoders(transformers: dict[str, Transformer]):
		return {
			lang: (lambda sentences, model=transformer: model.encode(sentences, PoolingMethod.MEAN))
			for lang, transformer in transformers.items()
		}

	engines: dict[str, DenseVectorEngine] = {}

	model_name = "sbert"
	if model_name in models:
		sbert_models = build_transformer_encoders(models[model_name])
		engines[model_name] = DenseVectorEngine(sbert_models, model_name, base_dir)

	return engines

def build_similarity_engine(base_dir: str):
	settings = get_settings()
	languages = settings.languages

	models = load_models(languages)

	engines = build_dense_vector_engines(models, base_dir)
	
	for engine in engines.values():
		engine.load_all(languages)

	similarity_engine = SimilarityEngine(
		word2vecs=models["word2vec"],
		sberts=models["sbert"],
		berts=models["bert"],
		nlps=models["nlp"],
		lstms=models["lstm"],
		engines=engines
	)

	return similarity_engine
