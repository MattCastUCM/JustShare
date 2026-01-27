import re
import nltk
import unicodedata
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from nltk.tokenize import TweetTokenizer
from autocorrect import Speller
from language_code import get_language_code

nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)

class TextPreprocessor:
    stopwords: set[str]
    stemmer: SnowballStemmer
    tokenizer: TweetTokenizer
    speller: Speller
    MIN_NGRAM_SIZE = 2

    def __init__(self, language: str):
        self.stopwords = set(stopwords.words(language))
        self.stemmer = SnowballStemmer(language)
        self.tokenizer = TweetTokenizer(reduce_len=True)
        self.speller = Speller(get_language_code(language))

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
    
    def tokenize(self, text: str):
        tokens = self.tokenizer.tokenize(text)
        return tokens
    
    def remove_stopwords(self, tokens: list[str]):
        tokens = [token for token in tokens if not token.lower() in self.stopwords]
        return tokens
    
    def remove_accents(self, text: str):
        text = unicodedata.normalize("NFD", text)
        return re.sub(r"[\u0300-\u036f]", "", text)
    
    def stem(self, tokens: list[str]):
        tokens = [self.stemmer.stem(token) for token in tokens]
        return tokens

    def preprocess(self, text: str, clean: bool = True, autocorrect: bool = True, tokenize: bool = True, remove_stopwords: bool = True, stem: bool = True, remove_accents: bool = True, max_n: int = 1) -> list[str]:
        if clean:
            text = self.clean_text(text)
        if autocorrect:
            text = self.speller.autocorrect_sentence(text)
        if tokenize:
            tokens = self.tokenize(text)
        else:
            tokens = [text]
        if remove_stopwords:
            tokens = self.remove_stopwords(tokens)
        if stem:
            tokens = self.stem(tokens)
        if remove_accents:
            tokens = [self.remove_accents(token) for token in tokens]
        tokens = self.add_ngrams(tokens, max_n)
        return tokens