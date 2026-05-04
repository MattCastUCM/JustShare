from services.encoder_factory import EncoderFactory
from services.calibrator_factory import CalibratorFactory
from services.node_engine import NodeEngine
from controllers.retrievers.dense import DenseRetriever

class MultilingualManager:
	def __init__(self, encoder_factory: EncoderFactory, calibrator_factory: CalibratorFactory, base_dir: str):
		self.encoder_factory = encoder_factory
		self.calibrator_factory = calibrator_factory
		self.base_dir = base_dir

		self.node_cache: dict[tuple[str, str], NodeEngine] = {}

	def get_dense_retriever(self, language: str, model_type: str, similarity_fn):
		encoder = self.encoder_factory.get(model_type, language)
		calibrator = self.calibrator_factory.get(model_type, language)

		return DenseRetriever(
			encoder=encoder,
			similarity_fn=similarity_fn,
			calibrator=calibrator
		)
	
	def get_node_engine(self, language: str, model_type: str):
		key = (language, model_type)

		if key not in self.node_cache:
			encoder = self.encoder_factory.get(model_type, language)
			calibrator = self.calibrator_factory.get(model_type, language)

			node_engine = NodeEngine(
				encoder=encoder,
				base_dir=self.base_dir,
				language=language,
				calibrator=calibrator
			)

			self.node_cache[key] = node_engine

		return self.node_cache[key]
		
	def load_all_node_engines(self, languages: set[str], model_types: list[str]):
		for language in languages:
			for model_type in model_types:
				key = (language, model_type)

				if key not in self.node_cache:
					encoder = self.encoder_factory.get(model_type, language)
					calibrator = self.calibrator_factory.get(model_type, language)

					node_engine = NodeEngine(
						encoder=encoder,
						base_dir=self.base_dir,
						language=language,
						calibrator=calibrator
					)

					node_engine.load_all()

					self.node_cache[key] = node_engine
					
	def iter_node_engines(self):
		return self.node_cache.values()
	