from loguru import logger
from typing import Callable, TypeVar, Optional, Generic

T = TypeVar("T")

class LazyLoader(Generic[T]):
	def __init__(self, loader: Callable[[], T], identifier: str, model_type: str):
		self._loader = loader
		self._model: Optional[T] = None
		self.identifier = identifier
		self.model_type = model_type

	@property
	def model(self) -> T:
		if self._model is None:
			logger.debug(f"Loading {self.model_type} for '{self.identifier}'...")
			try:
				self._model = self._loader()
			except Exception as e:
				logger.exception(f"Failed to load {self.model_type} for '{self.identifier}': {e}")
				raise
			logger.debug(f"Successfully loaded {self.model_type} for '{self.identifier}'.")
		return self._model

	def __repr__(self):
		status = "loaded" if self._model is not None else "not loaded"
		return f"<LazyLoader({self.model_type}, {self.identifier}, {status})>"
	