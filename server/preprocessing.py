import re
import nltk
import unicodedata
from nltk.corpus import stopwords
from nltk.stem.snowball import SnowballStemmer
from nltk.stem.api import StemmerI

nltk.download("stopwords", quiet=True)

class TextPreprocessor:
    max_n: int
    stopwords: set[str]
    stemmer: StemmerI

    def __init__(self, max_n: int, language):
        self.max_n = max_n
        self.stopwords = set(stopwords.words(language))
        self.stemmer = SnowballStemmer(language)

    def _ngrams(self, tokens: list[str], n: int):
        n_tokens = len(tokens)
        result = []
        for i in range(n_tokens - n + 1):
            result.append("_".join(tokens[i:i + n]))
        return result

    def preprocess(self, text: str):
        text = text.lower()
        text = re.sub(r"[^a-záéíóúüñ\s]", "", text)

        tokens = re.split(r"\s+", text)

        normalized_tokens = []
        for token in tokens:
            if token and token not in self.stopwords:
                # Quitar tildes
                token = unicodedata.normalize("NFD", token)
                token = re.sub(r"[\u0300-\u036f]", "", token)
                token = self.stemmer.stem(token)
                normalized_tokens.append(token)

        return normalized_tokens
    
    def preprocess_with_ngrams(self, text: str):
        tokens = self.preprocess(text)
        all_tokens = tokens.copy()
        for n in range(2, self.max_n + 1):
            ngrams = self._ngrams(tokens, n)
            all_tokens.extend(ngrams)
        return all_tokens