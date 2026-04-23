from abc import ABC, abstractmethod
from utils.vector_numpy import l2_normalize
from typing import Optional

class Encoder(ABC):
	name = "encoder"

	def __init__(self, name: Optional[str] = None):
		self.name = name or self.__class__.name

	@abstractmethod
	def fit(self, texts: list[str]):
		raise NotImplementedError
	
	@abstractmethod
	def _transform(self, texts: list[str]):
		raise NotImplementedError()

	def transform(self, texts: list[str], normalize: bool = True):
		X = self._transform(texts)
		if normalize:
			X = l2_normalize(X)
		return X

	def fit_transform(self, texts: list[str]):
		self.fit(texts)
		X = self.transform(texts)
		return X
	