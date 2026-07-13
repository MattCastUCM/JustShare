from services.encoder_factory import EncoderFactory
from services.calibrator_factory import CalibratorFactory
from services.node_engine import NodeEngine
from controllers.retrievers.dense import DenseRetriever
from adaptation.misc import NameAnonymizer
from schemas.similarity import SearchMethod
from collections.abc import Iterable

class MultilingualManager:
	def __init__(self, encoder_factory: EncoderFactory, calibrator_factory: CalibratorFactory, name_anonymizer: NameAnonymizer, base_dir: str):
		self.encoder_factory = encoder_factory
		self.calibrator_factory = calibrator_factory
		self.name_anonymizer = name_anonymizer
		self.base_dir = base_dir

		self.node_cache: dict[tuple[str, str], NodeEngine] = {}

	def get_dense_retriever(self, language: str, method: SearchMethod, similarity_fn):
		encoder = self.encoder_factory.get(method, language)
		calibrator = self.calibrator_factory.get(method, language)

		return DenseRetriever(
			encoder=encoder,
			similarity_fn=similarity_fn,
			name_anonymizer=self.name_anonymizer,
			calibrator=calibrator
		)
	
	def get_node_engine(self, language: str, method: SearchMethod):
		key = (language, method)

		if key not in self.node_cache:
			calibrator = self.calibrator_factory.get(method, language)

			node_engine = NodeEngine(
				encoder_factory=self.encoder_factory,
				method=method,
				base_dir=self.base_dir,
				language=language,
				calibrator=calibrator,
				name_anonymizer=self.name_anonymizer
			)

			self.node_cache[key] = node_engine

		return self.node_cache[key]
		
	def load_all_node_engines(self, languages: set[str], methods: Iterable[SearchMethod]):
		for language in languages:
			for method in methods:
				key = (language, method)

				if key not in self.node_cache:
					calibrator = self.calibrator_factory.get(method, language)

					node_engine = NodeEngine(
						encoder_factory=self.encoder_factory,
						method=method,
						base_dir=self.base_dir,
						language=language,
						calibrator=calibrator,
						name_anonymizer=self.name_anonymizer
					)

					node_engine.load_all()

					self.node_cache[key] = node_engine
					
	def iter_node_engines(self):
		return self.node_cache.values()
	