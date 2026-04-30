from controllers.encoders.encoder import Encoder
from typing import Callable
import numpy as np

class JaccardEncoder(Encoder):
    name = "jaccard"

    def __init__(self, preprocessor_fn: Callable[[str], list[str]]):
        super().__init__()
        self.preprocess = preprocessor_fn

    @staticmethod
    def jaccard(a: list[set[str]], b: set):
        scores = []
        for doc in a:
            if not doc and not b:
                scores.append(0.0)
            else:
                scores.append(len(doc & b) / len(doc | b))

        return np.array(scores)

    def fit(self, texts: list[str]):
        pass

    def transform(self, texts: list[str], normalize: bool = True):
        corpus_tokens = [
            set(self.preprocess(doc))
            for doc in texts
        ]

        return corpus_tokens
    