from sklearn.isotonic import IsotonicRegression
import numpy as np
import joblib

def fit_isotonic_regression(y_pred: np.ndarray, y_true: np.ndarray, save_path: str):
    # Pool Adjacent Violators Algorithm (PAVA)
    iso = IsotonicRegression(out_of_bounds="clip")
    iso.fit(y_pred, y_true)

    joblib.dump(iso, save_path)

    return iso
