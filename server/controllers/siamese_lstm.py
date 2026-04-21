import os
os.environ["KERAS_BACKEND"] = "torch"

from utils import vector_keras, vector_numpy
from siamese_lstm.models.siamese_lstm import SiameseLSTM
from controllers.retriever import BaseRetriever
from keras.models import load_model
import joblib
import numpy as np
import torch

class SiameseLSTM:
    def __init__(self, model_dir: str):
        self.model_dir = model_dir

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print("Using device:", self.device)

        self.embedding_matrix = self._load_embeddings()
        self.vectorizer = self._load_vectorizer()
        self.model = self._load_full_model()
        self.model.eval()
        self.head_model = self.model.get_head_model().to(self.device)
        self.head_model.eval()
        self.iso_regression = self._load_iso_regression()

    def _load_file(self, filename: str):
        path = os.path.join(self.model_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required file not found: {path}")
        return path
 
    def _load_embeddings(self):
        path = self._load_file("embedding_matrix.npy")
        return np.load(path)

    def _load_vectorizer(self):
        path = self._load_file("vectorizer.keras")
        model = load_model(path)
        return model.layers[0]

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
    
    def _load_iso_regression(self):
        path = self._load_file("iso.joblib")
        return joblib.load(path)

    def encode(self, sentences: list[str], normalize: bool=True):
        with torch.no_grad():
            sentence_tensor = self.vectorizer(sentences).to(self.device)
            embeddings = self.head_model(sentence_tensor)

            if normalize:
                embeddings = vector_numpy.l2_normalize(embeddings)

            return embeddings.detach().cpu().numpy()

    def predict_similarity(self, sentences1: list[str], sentences2: list[str]):
        with torch.no_grad():
            tensor1 = self.vectorizer(sentences1).to(self.device)
            tensor2 = self.vectorizer(sentences2).to(self.device)

            similarity = self.model([tensor1, tensor2])
            similarity = similarity.detach().cpu().numpy()

            return self.calibrate(similarity)
    
    def calibrate(self, similarity: np.ndarray):
        return self.iso_regression.predict(similarity)
    
    def print_device(self):
        print("Head model device:", next(self.head_model.parameters()).device)

class LSTMRetriever(BaseRetriever):
    def __init__(self, siamese_lstm_models: dict[str, SiameseLSTM]):
        self.models = siamese_lstm_models

    def fit(self, corpus: list[str], language: str):
        self.corpus = corpus
        self.language = language

        model = self.models.get(language)
        if model is None:
            raise ValueError(f"No LSTM found for language '{language}'")

        self.model = model

        self.embeddings = self.model.encode(corpus)

        return self

    def search(self, query: str, top_k: int=3):
        if self.embeddings is None:
            raise ValueError("Retriever not fitted. Call 'fit' first.")
        
        query_embedding = self.model.encode([query])[0]

        scores = vector_numpy.cosine_similarity(self.embeddings, query_embedding)

        scores = self.model.calibrate(scores)

        top_indices = np.argsort(scores)[::-1][:top_k]

        idx_arr = np.array(top_indices, dtype=np.int32)
        score_arr = scores[top_indices].astype(np.float32)
        text_arr = np.array([self.corpus[i] for i in top_indices], dtype=object)

        return idx_arr, score_arr, text_arr