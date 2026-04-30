from abc import ABC, abstractmethod
from typing import Optional

class Encoder(ABC):
	name = "encoder"

	def __init__(self, name: Optional[str] = None):
		self.name = name or self.__class__.name

	@abstractmethod
	def fit(self, texts: list[str]):
		raise NotImplementedError
	
	@abstractmethod
	def transform(self, texts: list[str], normalize: bool = True):
		raise NotImplementedError()

	def fit_transform(self, texts: list[str]):
		self.fit(texts)
		X = self.transform(texts)
		return X
	