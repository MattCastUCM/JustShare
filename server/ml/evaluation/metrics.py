import numpy as np
from scipy.stats import pearsonr, spearmanr
from keras import Model
import tensorflow as tf

def evaluate_model(model: Model, dataset: tf.data.Dataset):
    y_true = np.concatenate([y.numpy() for _, y in dataset], axis=0)
    y_pred = model.predict(dataset).flatten()

    errors = y_true - y_pred

    mse = np.mean(errors ** 2)
    mae = np.mean(np.abs(errors))
    rmse = np.sqrt(mse)

    epsilon = 1e-8

    bias = np.mean(errors)

    ss_res = np.sum(errors ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1 - (ss_res / (ss_tot + epsilon))

    # Comprueba si la relación entre las predicciones y las etiquetas sigue una línea recta.
	# 1.0 --> correlación positiva perfecta
	# 0.0 --> sin correlación
	# -1.0 --> correlación negativa perfecta
    pearson = pearsonr(y_true, y_pred)[0]

    # Compara el orden de las predicciones y los valores reales.
    spearman = spearmanr(y_true, y_pred)[0]

    print(
        f"Pearson: {pearson:.4f} | "
        f"Spearman: {spearman:.4f} | "
        f"MSE: {mse:.6f} | "
        f"MAE: {mae:.6f} | "
        f"RMSE: {rmse:.6f} | "
        f"R²: {r2:.4f}"
    )

    metrics = {
        "pearson": float(pearson),
        "spearman": float(spearman),
        "mse": float(mse),
        "mae": float(mae),
        "rmse": float(rmse),
        "bias": float(bias),
        "r2": float(r2),
        "n_samples": int(len(y_true))
    }

    return metrics
