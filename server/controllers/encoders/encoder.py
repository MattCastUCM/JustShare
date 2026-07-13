from abc import ABC, abstractmethod
from schemas.similarity import SearchMethod

class Encoder(ABC):
	def __init__(self, name: SearchMethod):
		self.name = name

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
	