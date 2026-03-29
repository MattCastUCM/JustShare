import os
from settings import get_settings

settings = get_settings()

data_path = "../data"
raw_dir = os.path.join(data_path, "raw")
processed_dir = os.path.join(data_path, "processed")
augmented_dir = os.path.join(data_path, "augmented")

os.makedirs(augmented_dir, exist_ok=True)

models_dir = "../models"
word2vec_path = os.path.join(models_dir, "spanish_word2vec", "spanish_word2vec.wordvectors")
embedding_path = os.path.join(models_dir, "embedding_matrix.npy")
vectorizer_path = os.path.join(models_dir, "vectorizer.keras")
siamese_dir = os.path.join(models_dir, settings.SIAMESE_DIR)

os.makedirs(siamese_dir, exist_ok=True)

siamese_path = os.path.join(siamese_dir, "siamese_lstm.keras")
history_path = os.path.join(siamese_dir, "history.npy")
