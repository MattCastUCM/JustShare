import os
os.environ["KERAS_BACKEND"] = "torch"

from typing import Optional
from utils import vector_keras
from siamese_lstm.models.siamese_lstm import SiameseLSTM
from keras.models import load_model
import numpy as np
import torch
from controllers.encoders.encoder import Encoder
from utils.vector_numpy import l2_normalize
from siamese_lstm.features.vectorizer import TextVectorizerModel
from schemas.similarity import SearchMethod

class SentenceLSTM(Encoder):
    def __init__(self, model_dir: str, device: Optional[str] = None):
        super().__init__(SearchMethod.LSTM)
        self.model_dir = model_dir

        self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
        print("Using device:", self.device)

        self.embedding_matrix = self._load_embeddings()
        self.vectorizer = self._load_vectorizer()
        self.model = self._load_full_model()
        self.model.eval()
        self.head_model = self.model.get_head_model().to(self.device)
        self.head_model.eval()

    def _load_file(self, filename: str):
        path = os.path.join(self.model_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required file not found: {path}")
        return path
 
    def _load_embeddings(self):
        path = self._load_file("embedding_matrix.npy")
        return np.load(path)

    def _load_vectorizer(self):
        dir = os.path.join(self.model_dir, "vectorizer")
        return TextVectorizerModel.load(dir)

    def _load_full_model(self):
        path = self._load_file("siamese_lstm.keras")

        custom_objects = {
            "SiameseLSTM": SiameseLSTM,
            "l2_normalize": vector_keras.l2_normalize,
            "manhattan_similarity": vector_keras.manhattan_similarity,
            "cosine_similarity": vector_keras.cosine_similarity,
        }

        model = load_model(path, custom_objects=custom_objects, compile=False)
        
        if hasattr(model, "embedding"):
            model.embedding.set_weights([self.embedding_matrix])
        else:
            raise AttributeError("Model does not have an 'embedding' attribute")

        return model.to(self.device)
    
    def fit(self, sentences: list[str]):
        pass

    def transform(self, sentences: list[str], normalize: bool = True):
        with torch.no_grad():
            sentence_tensor = self.vectorizer(sentences).to(self.device)
            embeddings = self.head_model(sentence_tensor, training=False)

            vec = embeddings.detach().cpu().numpy()
            if normalize:
                return l2_normalize(vec)
            return vec

    def predict_similarity(self, sentences_1: list[str], sentences_2: list[str]):
        with torch.no_grad():
            tensor1 = self.vectorizer(sentences_1).to(self.device)
            tensor2 = self.vectorizer(sentences_2).to(self.device)

            similarity = self.model([tensor1, tensor2], training=False)
            return similarity.detach().cpu().numpy()    
    
    def print_device(self):
        print("Head model device:", next(self.head_model.parameters()).device)
