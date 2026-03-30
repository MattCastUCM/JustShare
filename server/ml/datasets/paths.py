import os
from config.settings import get_settings

settings = get_settings()

data_path = "../data"
raw_dir = os.path.join(data_path, "raw")
processed_dir = os.path.join(data_path, "processed")
augmented_dir = os.path.join(data_path, "augmented")

models_dir = "../models"
word2vec_path = os.path.join(models_dir, "spanish_word2vec", "spanish_word2vec.wordvectors")

siamese_dir = os.path.join(models_dir, settings.siamese_name)

os.makedirs(siamese_dir, exist_ok=True)

embedding_path = os.path.join(siamese_dir, "embedding_matrix.npy")
vectorizer_path = os.path.join(siamese_dir, "vectorizer.keras")
siamese_path = os.path.join(siamese_dir, "siamese_lstm.keras")
history_path = os.path.join(siamese_dir, "history.npy")
metrics_path = os.path.join(siamese_dir, "metrics.json")
save_path = os.path.join(siamese_dir, "training_history.png")
