import re
import unicodedata
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from nltk.tokenize import TweetTokenizer
from autocorrect import Speller
from language_code import get_language_code
import spacy
from spacy.tokens import Doc
from pydantic import BaseModel
from typing import Callable
from spacy.language import Language

class Token(BaseModel):
    text: str
    lemma: str = ""
    stemmed_word: str = ""
    pos: str = ""

TextStep = Callable[[str], str]
TokenStep = Callable[[list[Token]], list[Token]]

class TextPreprocessor:
    MIN_NGRAM_SIZE = 2

    def __init__(self, language: str, spacy_models: dict[str, Language]):
        self.stopwords = set(stopwords.words(language))
        self.stemmer = SnowballStemmer(language)
        self.tokenizer = TweetTokenizer(reduce_len=True)
        self.speller = Speller(get_language_code(language))
        self.nlp = spacy_models.get(language)

    # --------------------
    # Text-level steps
    # --------------------

    def clean_text(self, text: str):
        text = text.lower()

        # Eliminar URLs
        text = re.sub(r"http\S+|www\S+", " ", text)

        # Eliminar todo excepto letras de cualquier idioma (UNICODE) y números
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
    
    # --------------------
    # Token-level steps
    # --------------------

    def tokenize(self, text: str):
        tokens = self.tokenizer.tokenize(text)
        tokens = [Token(text=token) for token in tokens]
        return tokens
    
    def remove_stopwords(self, tokens: list[Token]):
        tokens = [token for token in tokens if not token.text.lower() in self.stopwords]
        return tokens
    
    def stem(self, tokens: list[Token]):
        for token in tokens:
            token.stemmed_word = self.stemmer.stem(token.text)
        return tokens
    
    def lemmatize_and_pos(self, tokens: list[Token], lemmatize: bool = True, get_pos: bool = True) -> list[Token]:
        if self.nlp:
            words = [token.text for token in tokens]
            doc = Doc(self.nlp.vocab, words=words)

            for _, proc in self.nlp.pipeline:
                doc = proc(doc)

            for spacy_token, token in zip(doc, tokens):
                if lemmatize:
                    token.lemma = spacy_token.lemma_
                if get_pos:
                    token.pos = spacy_token.pos_

        return tokens
    
    def pipeline_tokenize(self, text: str, steps: list[TextStep]) -> list[Token]:
        for step in steps:
            text = step(text)
        return self.tokenize(text)
    
    # --------------------
    # Ngrams
    # --------------------

    def _ngrams(self, tokens: list[str], n: int):
        n_tokens = len(tokens)
        result = []
        for i in range(n_tokens - n + 1):
            result.append("_".join(tokens[i:i + n]))
        return result
    
    def add_ngrams(self, tokens: list[str], max_n: int):
        if max_n < self.MIN_NGRAM_SIZE:
            return tokens
        
        all_tokens = list(tokens)
        for n in range(self.MIN_NGRAM_SIZE, max_n + 1):
            ngrams = self._ngrams(tokens, n)
            all_tokens.extend(ngrams)
        return all_tokens
    
    # --------------------
    # Generic token utilities
    # --------------------
    
    def map_tokens(self, tokens: list[Token], fields: list[str], function: Callable[[str], str]):
        for token in tokens:
            for field in fields:
                value = getattr(token, field, None)
                if value and isinstance(value, str):
                    setattr(token, field, function(value))
        return tokens
    
    def preprocess(self, tokens: list[Token], steps: list[TokenStep]):
        for step in steps:
            tokens = step(tokens)
        return tokens