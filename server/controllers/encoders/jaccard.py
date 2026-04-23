from controllers.encoders.encoder import Encoder
from typing import Callable

class JaccardEncoder(Encoder):
    name = "jaccard"

    def __init__(self, preprocessor_fn: Callable[[str], list[str]]):
        self.preprocess = preprocessor_fn

    @staticmethod
    def jaccard(a: set[str], b: set[str]):
        if not a and not b:
            return 0.0
        return len(a & b) / len(a | b)

    def fit(self, texts: list[str]):
        pass

    def _transform(self, texts: list[str]):
        corpus_tokens = [
            set(self.preprocess(doc))
            for doc in texts
        ]

        return corpus_tokens
    