import os
from typing import Optional

class ProjectPaths:
    def __init__(self, base_dir: str="../", siamese_name: Optional[str]=None):
        self.base_dir = base_dir
        self.siamese_name = siamese_name
        self._setup_paths()

    def _make_dirs(self, dirs: list[str]):
        for dir in dirs:
            os.makedirs(dir, exist_ok=True)

    def _setup_paths(self):
        self.data_dir = os.path.join(self.base_dir, "data")
        self.raw_dir = os.path.join(self.data_dir, "raw")
        self.processed_dir = os.path.join(self.data_dir, "processed")
        self.augmented_dir = os.path.join(self.data_dir, "augmented")
        self._make_dirs([self.raw_dir, self.processed_dir, self.augmented_dir])

        self.models_dir = os.path.join(self.base_dir, "models")
        self._make_dirs([self.models_dir])

        self.word2vec_dir = os.path.join(self.models_dir, "spanish_word2vec")
        self._make_dirs([self.word2vec_dir])
        self.word2vec_path = os.path.join(self.word2vec_dir, "spanish_word2vec.wordvectors")

        if self.siamese_name:
            self._update_siamese_paths(self.siamese_name)
        else:
            self.siamese_dir = None
            self.test_dir = None
            self.calibration_dir = None
            self.embedding_path = None
            self.vectorizer_path = None
            self.siamese_path = None
            self.history_path = None
            self.metrics_path = None
            self.config_path = None
            self.iso_path = None

    def _update_siamese_paths(self, siamese_name: str):
        self.siamese_dir = os.path.join(self.models_dir, siamese_name)
        self.test_dir = os.path.join(self.siamese_dir, "test")
        self.calibration_dir = os.path.join(self.siamese_dir, "calibration")
        self._make_dirs([self.siamese_dir, self.test_dir, self.calibration_dir])

        self.embedding_path = os.path.join(self.siamese_dir, "embedding_matrix.npy")
        self.vectorizer_path = os.path.join(self.siamese_dir, "vectorizer.keras")
        self.siamese_path = os.path.join(self.siamese_dir, "siamese_lstm.keras")
        self.history_path = os.path.join(self.siamese_dir, "history.npy")
        self.metrics_path = os.path.join(self.siamese_dir, "metrics.json")
        self.config_path = os.path.join(self.siamese_dir, "run_config.json")
        self.iso_path = os.path.join(self.siamese_dir, "iso.joblib")

    def change_siamese(self, new_siamese_name: str):
        self.siamese_name = new_siamese_name
        self._update_siamese_paths(new_siamese_name)