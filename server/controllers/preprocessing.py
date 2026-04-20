import re
import unicodedata
from autocorrect import Speller
from core.language_name import get_language_name
from pydantic import BaseModel
from typing import Callable
from spacy.language import Language
from nltk import SnowballStemmer

class Token(BaseModel):
	text: str
	lemma: str = ""
	stem: str = ""
	pos: str = ""

TextStep = Callable[[str], str]
TokenStep = Callable[[list[Token]], list[Token]]

class TextPreprocessor:
	MIN_NGRAM_SIZE = 2

	def __init__(self, language: str, nlp: Language):
		self.stopwords = nlp.Defaults.stop_words
		self.stemmer = SnowballStemmer(get_language_name(language))
		self.speller = Speller(language)
		self.nlp = nlp

	# --------------------
	# Pasos a nivel de texto
	# --------------------

	def clean_text(self, text: str):
		text = text.lower()

		# Eliminar URLs
		text = re.sub(r"http\S+|www\S+", " ", text)

		# Eliminar todo excepto letras de cualquier idioma (cualquier idioma) y números
		text = re.sub(r"[^\w\s]", " ", text, flags=re.UNICODE)
		# Eliminar números
		text = re.sub(r"\d+", " ", text)

		# Juntar espacios múltiples
		text = re.sub(r"\s+", " ", text).strip()

		return text
	
	def remove_accents(self, text: str):
		text = unicodedata.normalize("NFD", text)
		return re.sub(r"[\u0300-\u036f]", "", text)
	
	def autocorrect(self, text: str):
		return self.speller.autocorrect_sentence(text)
	
	def remove_stopwords(self, tokens: list[Token]):
		tokens = [token for token in tokens if not token.text.lower() in self.stopwords]
		return tokens
	
	def stem(self, tokens: list[Token]):
		for token in tokens:
			token.stem = self.stemmer.stem(token.text)
		return tokens
	
	def tokenize(self, text: str) -> list[Token]:
		doc = self.nlp(text)
		tokens = []
		for spacy_token in doc:
			token = Token(
				text=spacy_token.text,
				lemma=spacy_token.lemma_,
				pos=spacy_token.pos_
			)
			tokens.append(token)
		return tokens
	
	def pipeline_tokenize(self, text: str, steps: list[TextStep]):
		for step in steps:
			text = step(text)
		return self.tokenize(text)
	
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
	
	def add_ngrams_to_tokens(self, tokens: list[Token], min_n: int, max_n: int, field: str = "text", sep: str = "_"):
		text_tokens = [getattr(token, field, token.text) for token in tokens]

		all_tokens = tokens[:]
		for n in range(min_n, max_n + 1):
			ngrams = self._ngrams(text_tokens, n, sep=sep)
			all_tokens.extend(Token(text=ngram) for ngram in ngrams)
		return all_tokens
	
	# --------------------
	# Utilidades de tokens genéricos
	# --------------------
	
	def map_tokens(self, tokens: list[Token], fields: list[str], func: Callable[[str], str]):
		for token in tokens:
			for field in fields:
				if hasattr(token, field):
					current = getattr(token, field)
					if isinstance(current, str):
						setattr(token, field, func(current))
		return tokens

	def preprocess_tokens(self, tokens: list[Token], steps: list[TokenStep]):
		for step in steps:
			tokens = step(tokens)
		return tokens

	def run_pipeline(self, text: str, text_steps: list[TextStep], token_steps: list[TokenStep]):
		for step in text_steps:
			text = step(text)

		tokens = self.tokenize(text)

		for step in token_steps:
			tokens = step(tokens)

		return tokens