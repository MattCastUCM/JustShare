from keras import layers, Sequential
from keras.saving import load_model
from nltk.tokenize import ToktokTokenizer
import json
import os

class TextVectorizerModel():
    def __init__(self, max_len: int, case: bool = False, strip_punctuation: bool = False):
        self.max_len = max_len
        self.case = case
        self.strip_punctuation = strip_punctuation

        self.toktok = ToktokTokenizer()

        if strip_punctuation and not case:
            standardize = "lower_and_strip_punctuation"
        elif strip_punctuation and case:
            standardize = "strip_punctuation"
        elif not strip_punctuation and not case:
            standardize = "lower"
        else:
            standardize = None

        self.vectorizer = layers.TextVectorization(
            output_mode="int",
            output_sequence_length=max_len,
            standardize=standardize,
            split="whitespace"
        )

    def preprocess(self, sentences: list[str]):
        return [
            " ".join(self.toktok.tokenize(sentence))
            for sentence in sentences
        ]

    def adapt(self, sentences: list[str]):
        tokenized_sentences = self.preprocess(sentences)

        self.vectorizer.adapt(tokenized_sentences)

    def __call__(self, inputs: list[str]):
        tokenized = self.preprocess(inputs)
        return self.vectorizer(tokenized)

    def get_vocabulary(self):
        return self.vectorizer.get_vocabulary()
    
    def save(self, dir: str):
        model = Sequential([self.vectorizer])
        model.save(os.path.join(dir, "vectorizer.keras"))

        with open(os.path.join(dir, "config.json"), "w") as f:
            json.dump(
                {
                    "max_len": self.max_len,
                    "case": self.case,
                    "strip_punctuation": self.strip_punctuation,
                },
                f,
            )

    @classmethod
    def load(cls, dir: str):
        with open(os.path.join(dir, "config.json")) as f:
            config = json.load(f)

        obj = cls(**config)

        model = load_model(os.path.join(dir, "vectorizer.keras"))
        obj.vectorizer = model.layers[0]

        return obj
    