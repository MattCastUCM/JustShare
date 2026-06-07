from abc import ABC, abstractmethod
from typing import Sequence
import math
from collections import defaultdict
from tqdm import tqdm
import pickle

class LanguageModel(ABC):
	"""Abstract base class for n-gram language models."""

	@abstractmethod
	def train(self, sentences: list[list[str]]) -> None:
		"""Train the language model on a list of tokenized sentences."""
		pass

	@abstractmethod
	def logscore(self, word: str, context: Sequence[str]) -> float:
		"""Return the base-10 logarithm of the conditional probability P(word | context)."""
		pass

	@abstractmethod
	def perplexity(self, test_sentences: list[list[str]]) -> float:
		"""Compute the perplexity of the model on a list of tokenized test sentences."""
		pass
	
class BaseNgramModel(LanguageModel, ABC):
	def __init__(self, order: int, unk_threshold: int = 2):
		self.order = order
		self.unk_threshold = unk_threshold
		
		self.unk_token = "<unk>"
		self.bos_token = "<s>"
		self.eos_token = "</s>"

		self.vocab = set()
		self.word_freq = defaultdict(int)

	def save(self, path: str) -> None:
		with open(path, "wb") as f:
			pickle.dump(self, f)

	@classmethod
	def load(cls, path: str):
		with open(path, "rb") as f:
			model = pickle.load(f)

		return model

	def build_vocabulary(self, sentences: list[list[str]]):
		for sent in sentences:
			for word in sent:
				self.word_freq[word] += 1

		self.vocab.add(self.unk_token)

	def replace_rare(self, sentence: list[str]) -> list[str]:
		result = []
		for w in sentence:
			if self.word_freq.get(w, 0) > self.unk_threshold:
				result.append(w)
			else:
				result.append(self.unk_token)
		return result
	
	def normalize_word(self, word: str) -> str:
		if word in self.vocab:
			return word
		return self.unk_token
	
	def normalize_context(self, context: Sequence[str]) -> tuple[str, ...]:
		return tuple(
			self.normalize_word(w)
			for w in context
		)
	
	def logscore(self, word: str, context: Sequence[str]) -> float:
		word = self.normalize_word(word)
		context = self.normalize_context(context)

		prob = self.probability(word, context)

		if prob <= 0:
			prob = 1e-12
		return math.log10(prob)
	
	@abstractmethod
	def probability(self, word: str, context: tuple[str, ...]) -> float:
		pass

	def perplexity(self, test_sentences: list[list[str]]) -> float:
		"""Compute perplexity of the model on test sentences."""
		log_sum = 0.0
		total_words = 0
		for sent in test_sentences:
			sent_boundaries = [self.bos_token] * (self.order - 1) + sent + [self.eos_token]
			for i in range(self.order - 1, len(sent_boundaries)):
				word = sent_boundaries[i]
				context = sent_boundaries[max(0, i - self.order + 1):i]
				log_prob = self.logscore(word, context)
				log_sum += log_prob
				total_words += 1
		return 10.0 ** (-log_sum / total_words)
	

def int_defaultdict():
	return defaultdict(int)
	
class LaplaceNGramModel(BaseNgramModel):
	def __init__(self, order: int = 3, unk_threshold: int = 2, k: float = 1.0):
		super().__init__(order, unk_threshold)
		self.k = k
		self.counts = [defaultdict(int_defaultdict) for _ in range(order)]

	def train(self, sentences: list[list[str]]):
		for sent in tqdm(sentences, desc="Training"):
			processed = self.replace_rare(sent)

			padded = [self.bos_token] * (self.order - 1) + processed + [self.eos_token]
			for i, word in enumerate(padded):
				self.counts[0][()][word] += 1
				self.vocab.add(word)

				# Recorre todos los tamaños de los ngramas mayores que 1
				# Si order = 3, entonces n = 2, 3
				for n in range(2, self.order+1):
					# Asegurar que hay suficientes palabras
					if i >= n-1:
						context = tuple(padded[i-n+1:i])
						self.counts[n - 1][context][word] += 1
		self.vocab_size = len(self.vocab)

	def probability(self, word: str, context: tuple[str, ...]) -> float:
		n = len(context) + 1
		if n == 1:
			# Add-k smoothing
			n_context = sum(self.counts[0][()].values())
			n_ngram = self.counts[0][()][word]

			return (n_ngram + self.k) / (n_context + self.k * self.vocab_size)
		else:
			# context = ("green", "elephant") 
			# word = "sat"
			# Número de veces que aparece word dado el contexto
			n_ngram = self.counts[n - 1][context].get(word, 0)
			# Número de veces que aparece el contexto dada cualquier palabra a continuación
			n_context = sum(self.counts[n - 1][context].values())
			if n_context == 0:
				# Backoff
				return self.probability(word, context[1:])
			return (n_ngram + self.k) / (n_context + self.k * self.vocab_size)
	
# https://en.wikipedia.org/wiki/Kneser%E2%80%93Ney_smoothing
# https://medium.com/@dennyc/a-simple-numerical-example-for-kneser-ney-smoothing-nlp-4600addf38b8
# https://norvig.com/spell-correct.html
# https://www.geeksforgeeks.org/nlp/discounting-techniques-in-language-models/
# https://www.kaggle.com/code/dhruvdeshmukh/spelling-corrector-using-n-gram-language-model/notebook
# https://medium.com/@rybolos/5-weird-tricks-for-a-good-spell-checker-200617e041c1
# https://mbrenndoerfer.com/writing/smoothing-techniques-ngram-language-models-laplace-kneser-ney

class KNgramModel(BaseNgramModel):
	def __init__(self, order: int = 3, unk_threshold: int = 2, discount: float = 0.75):
		super().__init__(order, unk_threshold)
		# Descuento de Kneser-Ney
		self.discount = discount

		self.counts = [defaultdict(int_defaultdict) for _ in range(order)]

		# Estructuras específicas de Kneser‑Ney
		self.cont_count = defaultdict(int)			# En cuántos contextos aparece una palabra
		self.distinct_continuations = {}			# Cuántas opciones siguen a un contexto
		self.total_cont_sum = 0 					# Total global de continuaciones

	def train(self, sentences: list[list[str]]):
		for sent in sentences:
			for word in sent:
				self.word_freq[word] += 1

		self.vocab.add(self.unk_token)

		for sent in tqdm(sentences, desc="Training"):
			processed = self.replace_rare(sent)

			padded = [self.bos_token] * (self.order - 1) + processed + [self.eos_token]
			for i, word in enumerate(padded):
				# Contar unigramas
				self.counts[0][()][word] += 1
				self.vocab.add(word)

				# Contar n-gramas de orden superior
				for n in range(2, self.order + 1):
					if i >= n - 1:
						context = tuple(padded[i - n + 1:i])
						self.counts[n - 1][context][word] += 1

		# Conteo de continuaciones de Kneser-Ney a partir de bigramas
		bigram_counts = self.counts[1]
		for context, follow_dict in bigram_counts.items():
			for word in follow_dict:
				# Cada contexto distinto se cuenta una vez
				self.cont_count[word] += 1

		for n in range(1, self.order):
			for context in self.counts[n]:
				self.distinct_continuations[context] = len(self.counts[n][context])

		self.total_cont_sum = sum(self.cont_count.values()) if self.cont_count else 1.0

	def probability(self, word: str, context: tuple[str, ...]) -> float:
		# Caso base: contexto vacío -> unigrama de continuación. A diferencia de los otros algoritmos, este define la frecuencia del unigrama como la probabilidad de aparecer en diferentes contextos, no la frecuencia en sí misma
		if len(context) == 0:
			return self.cont_count.get(word, 0) / self.total_cont_sum

		order = len(context)

		# Número de veces que aparece el contexto
		n_context = sum(self.counts[order][context].values())

		# Si no existe ese n-grama, se retrocede a uno anterior (backoff)
		if n_context == 0:
			return self.probability(word, context[1:])

		# Frecuencia del n-grama completo (contexto + palabra)
		n_ngram = self.counts[order][context].get(word, 0)

		# Número de palabras distintas que pueden seguir a este contexto
		distinct = self.distinct_continuations.get(context, 0)

		# También se calculan los n-gramas de orden inferior (recursión)
		lower = self.probability(word, context[1:])

		# Redistribución de probabilidad restando un descuento fijo al conteo observado.
		# Esa masa se reparte proporcionalmente a la probabilidad del backoff (lower)
		higher = max(n_ngram - self.discount, 0) / n_context
		lambda_weight = (self.discount * distinct) / n_context

		return higher + lambda_weight * lower
	