import os
os.environ["KERAS_BACKEND"] = "torch"

from ml.models.similarity import l2_normalize, manhattan_similarity, cosine_similarity
from ml.models.siamese_lstm import SiameseLSTM
from keras.models import load_model
import numpy as np
import torch

class SentenceLSTM:
    def __init__(self, model_dir: str):
        self.model_dir = model_dir

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print("Using device:", self.device)

        self.embedding_matrix = self._load_embeddings()
        self.vectorizer = self._load_vectorizer()
        self.model = self._load_full_model()
        self.head_model = self.model.get_head_model().to(self.device)

    def _load_embeddings(self):
        path = os.path.join(self.model_dir, "embedding_matrix.npy")
        if not os.path.exists(path):
            raise FileNotFoundError(path)
        return np.load(path)

    def _load_vectorizer(self):
        path = os.path.join(self.model_dir, "vectorizer.keras")
        if not os.path.exists(path):
            raise FileNotFoundError(path)

        model = load_model(path)
        return model.layers[0]

    def _load_full_model(self):
        path = os.path.join(self.model_dir, "siamese_lstm.keras")
        if not os.path.exists(path):
            raise FileNotFoundError(path)

        custom_objects = {
            "SiameseLSTM": SiameseLSTM,
            "l2_normalize": l2_normalize,
            "manhattan_similarity": manhattan_similarity,
            "cosine_similarity": cosine_similarity,
        }

        model = load_model(path, custom_objects=custom_objects, compile=False)

        model.embedding.set_weights([self.embedding_matrix])

        return model.to(self.device)

    def encode(self, sentences: list[str], normalize: bool=True):
        sentence_tensor = self.vectorizer(sentences).to(self.device)
        embeddings = self.head_model(sentence_tensor)

        if normalize:
            embeddings = l2_normalize(embeddings)

        return embeddings.detach().cpu().numpy()

    def predict_similarity(self, sentences1: list[str], sentences2: list[str]):
        tensor1 = self.vectorizer(sentences1).to(self.device)
        tensor2 = self.vectorizer(sentences2).to(self.device)

        output = self.model([tensor1, tensor2])

        return output.detach().cpu().numpy()
    
    def print_device(self):
        print("Head model device:", next(self.head_model.parameters()).device)
