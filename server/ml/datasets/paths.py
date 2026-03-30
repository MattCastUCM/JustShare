import os
from config.settings import get_settings

settings = get_settings()

# base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
base_dir = "../"

data_dir = os.path.join(base_dir, "data")
raw_dir = os.path.join(data_dir, "raw")
processed_dir = os.path.join(data_dir, "processed")
augmented_dir = os.path.join(data_dir, "augmented")

for dir in [raw_dir, processed_dir, augmented_dir]:
    os.makedirs(dir, exist_ok=True)

models_dir = os.path.join(base_dir, "models")
os.makedirs(models_dir, exist_ok=True)

word2vec_dir = os.path.join(models_dir, "spanish_word2vec")
word2vec_path = os.path.join(word2vec_dir, "spanish_word2vec.wordvectors")
os.makedirs(word2vec_dir, exist_ok=True)

siamese_dir = os.path.join(models_dir, settings.siamese_name)
os.makedirs(siamese_dir, exist_ok=True)

embedding_path = os.path.join(siamese_dir, "embedding_matrix.npy")
vectorizer_path = os.path.join(siamese_dir, "vectorizer.keras")
siamese_path = os.path.join(siamese_dir, "siamese_lstm.keras")
history_path = os.path.join(siamese_dir, "history.npy")
metrics_path = os.path.join(siamese_dir, "metrics.json")
save_path = os.path.join(siamese_dir, "training_history.png")

histories_path = os.path.join(models_dir, "all_histories.png")
