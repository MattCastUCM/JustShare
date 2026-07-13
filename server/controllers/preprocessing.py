import re
import unicodedata
from core.language_name import get_language_name
from typing import Callable
from spacy.language import Language
from nltk import SnowballStemmer
from dataclasses import dataclass
from typing import Literal

TokenField = Literal["text", "lemma", "stem", "pos"]

@dataclass(slots=True)
class Token:
	text: str
	lemma: str = ""
	stem: str = ""
	pos: str = ""

TextStep = Callable[[str], str]
TokenStep = Callable[[list[Token]], list[Token]]

class TextPreprocessor:
	URL_RE = re.compile(r"http\S+|www\S+")
	PUNCT_RE = re.compile(r"[^\w\s]", re.UNICODE)
	DIGIT_RE = re.compile(r"\d+")
	SPACE_RE = re.compile(r"\s+")
	ACCENT_RE = re.compile(r"[\u0300-\u036f]")

	def __init__(self, language: str, nlp: Language):
		self.stopwords = nlp.Defaults.stop_words
		self.stemmer = SnowballStemmer(get_language_name(language))
		self.nlp = nlp

	# --------------------
	# Pasos a nivel de texto
	# --------------------

	def clean_text(self, text: str):
		text = text.lower()

		# Eliminar URLs
		text = self.URL_RE.sub(" ", text)

		# Eliminar todo excepto letras de cualquier idioma y números
		text = self.PUNCT_RE.sub(" ", text)

		# Eliminar números
		text = self.DIGIT_RE.sub(" ", text)

		# Juntar espacios múltiples
		text = self.SPACE_RE.sub(" ", text).strip()

		return text
	
	def remove_accents(self, text: str):
		text = unicodedata.normalize("NFD", text)
		return self.ACCENT_RE.sub("", text)
	
	def remove_stopwords(self, tokens: list[Token]):
		tokens = [token for token in tokens if not token.text.lower() in self.stopwords]
		return tokens
	
	def compute_stems(self, tokens: list[Token]):
		for token in tokens:
			token.stem = self.stemmer.stem(token.text)
		return tokens
	
	def tokenize(self, text: str, with_features: bool = True) -> list[Token]:
		if not with_features:
			doc = self.nlp.make_doc(text)
			return [Token(text=t.text) for t in doc]

		doc = self.nlp(text)

		return [
			Token(
				text=t.text,
				lemma=t.lemma_,
				pos=t.pos_,
			)
			for t in doc
		]
	
	# --------------------
	# Ngrams
	# --------------------
	@staticmethod
	def _ngrams(tokens: list[str], n: int, sep: str = "_"):
		n_tokens = len(tokens)
		result = []
		for i in range(n_tokens - n + 1):
			result.append(sep.join(tokens[i:i + n]))
		return result
	
	def generate_ngrams(self, tokens: list[Token], min_n: int, max_n: int, field: TokenField = "text", sep: str = "_") -> list[Token]:
		text_tokens = [getattr(token, field) for token in tokens]

		all_tokens = []
		for n in range(min_n, max_n + 1):
			ngrams = self._ngrams(text_tokens, n, sep=sep)
			all_tokens.extend(Token(text=ngram) for ngram in ngrams)
		return all_tokens
	
	# --------------------
	# Utilidades de tokens genéricos
	# --------------------
	
	def map_tokens(self, tokens: list[Token], fields: list[TokenField], func: Callable[[str], str]):
		for token in tokens:
			for field in fields:
				current = getattr(token, field)
				setattr(token, field, func(current))
		return tokens

	def transform_tokens(self, tokens: list[Token], steps: list[TokenStep]):
		for step in steps:
			tokens = step(tokens)
		return tokens
	
	def preprocess_text(self, text: str, steps: list[TextStep]):
		for step in steps:
			text = step(text)
		return text
	
	def preprocess(self, text: str, text_steps: list[TextStep], token_steps: list[TokenStep], with_features: bool = True):
		text = self.preprocess_text(text, text_steps)
		tokens = self.tokenize(text, with_features)
		return self.transform_tokens(tokens, token_steps)
