from services.model_registry import ModelRegistry
from typing import Optional, Callable
import numpy as np

Calibrator = Callable[[np.ndarray], np.ndarray]

class CalibratorFactory:
	def __init__(self, registry: ModelRegistry, default_calibrator: Optional[Calibrator] = None):
		self.registry = registry
		self.default_calibrator = default_calibrator
		self.custom_calibrators: dict[tuple[str, str], Callable] = {}

	def get(self, model_type: str, language: str) -> Calibrator | None:
		model = self.registry.get_calibrator(model_type, language)
		if model is not None:
			return model.predict
		
		key = (model_type, language)
		if key in self.custom_calibrators:
			return self.custom_calibrators[key]
		
		return self.default_calibrator		
	
	def add_calibrator(self, model_type: str, language: str, calibrator: Calibrator):
		key = (model_type, language)
		self.custom_calibrators[key] = calibrator
