import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.isotonic import IsotonicRegression
import os

def plot_history(history_dict, save_dir: str):
    plt.figure(figsize=(18, 5))

    # Loss plot
    plt.subplot(1, 3, 1)
    plt.plot(history_dict["loss"], label="train")
    plt.plot(history_dict["val_loss"], label="validation")

    # best_val_loss = np.min(history_dict["val_loss"])
    best_epoch_loss = np.argmin(history_dict["val_loss"])

    # plt.scatter(best_epoch_loss, best_val_loss, color='red', s=100,
                # label=f"best val_loss: {best_val_loss:.6f}")

    plt.title("Loss")
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.legend()

    # MAE plot
    plt.subplot(1, 3, 2)
    plt.plot(history_dict["mae"], label="train")
    plt.plot(history_dict["val_mae"], label="validation")

    # best_val_mae = np.min(history_dict["val_mae"])
    # best_epoch_mae = np.argmin(history_dict["val_mae"])

    # plt.scatter(best_epoch_mae, best_val_mae, color='red', s=100,
                # label=f"best val_mae: {best_val_mae:.6f}")

    plt.title("MAE")
    plt.xlabel("Epoch")
    plt.ylabel("Mean Absolute Error")
    plt.legend()

    # RMSE plot
    plt.subplot(1, 3, 3)
    plt.plot(history_dict["rmse"], label="train")
    plt.plot(history_dict["val_rmse"], label="validation")

    # best_val_rmse = np.min(history_dict["val_rmse"])
    # best_epoch_rmse = np.argmin(history_dict["val_rmse"])

    # plt.scatter(best_epoch_rmse, best_val_rmse, color='red', s=100,
                # label=f"best val_rmse: {best_val_rmse:.6f}")

    plt.title("RMSE")
    plt.xlabel("Epoch")
    plt.ylabel("Root Mean Squared Error")
    plt.legend()

    plt.tight_layout()
    save_path = os.path.join(save_dir, "training_history.png")
    plt.savefig(save_path)
    plt.show()

    result = {
        "train_loss": history_dict["loss"][-1],
        "train_mae": history_dict["mae"][-1],
        "val_loss": history_dict["val_loss"][best_epoch_loss],
        "val_mae": history_dict["val_mae"][best_epoch_loss],
        "train_rmse": history_dict["rmse"][-1],
        "val_rmse": history_dict["val_rmse"][best_epoch_loss]
    }

    return result

def plot_histories(histories: dict, save_dir: str):
    plt.figure(figsize=(18, 5))

    # ---- Loss plot ----
    plt.subplot(1, 3, 1)
    for name, history in histories.items():
        plt.plot(history["val_loss"], label=name)
    plt.title("Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.legend()

    # ---- MAE plot ----
    plt.subplot(1, 3, 2)
    for name, history in histories.items():
        plt.plot(history["val_mae"], label=name)
    plt.title("Validation MAE")
    plt.xlabel("Epoch")
    plt.ylabel("Mean Absolute Error")
    plt.legend()

    # ---- RMSE plot ----
    plt.subplot(1, 3, 3)
    for name, history in histories.items():
        plt.plot(history["val_rmse"], label=name)
    plt.title("Validation RMSE")
    plt.xlabel("Epoch")
    plt.ylabel("Root Mean Squared Error")
    plt.legend()

    plt.tight_layout()
    save_path = os.path.join(save_dir, "all_histories.png")
    plt.savefig(save_path)
    plt.show()

def plot_heatmap_kde(y_true: np.ndarray, y_pred: np.ndarray, save_dir: str, levels: int=50, cmap: str="viridis", bw_adjust: float=0.8):
    plt.figure(figsize=(6, 6))

    min_true = y_true.min()
    max_true = y_true.max()

    min_pred = y_pred.min()
    max_pred = y_pred.max()

    min_val = min(min_true, min_pred)
    max_val = max(max_true, max_pred)

    sns.kdeplot(
        x=y_true,
        y=y_pred,
        fill=True,
        cmap=cmap,
        levels=levels,
        bw_adjust=bw_adjust,
        thresh=0,
        cbar=True
    )

    plt.plot(
        [min_true, max_true],
        [min_true, max_true],
        "r--", 
        linewidth=2, 
        label="Perfect Prediction (x = y)"
    )

    text = f"min(y_pred): {min_pred:.3f}\nmax(y_pred): {max_pred:.3f}"
    plt.text(
        0.02, 0.98, text,
        transform=plt.gca().transAxes,
        fontsize=10,
        verticalalignment='top',
        bbox=dict(boxstyle="round", facecolor="white", alpha=0.8)
    )

    plt.xlim(min_val, max_val)
    plt.ylim(min_val, max_val)
    plt.xlabel("True Values")
    plt.ylabel("Predictions")
    plt.title("KDE Density: True vs Predicted")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    save_path = os.path.join(save_dir, "heatmap_kde.png")
    plt.savefig(save_path)
    plt.show()

def plot_heatmap_hist2d(y_true: np.ndarray, y_pred: np.ndarray, save_dir: str, bins: int=50, cmap: str="viridis"):
    plt.figure(figsize=(6, 6))

    min_true = y_true.min()
    max_true = y_true.max()

    min_pred = y_pred.min()
    max_pred = y_pred.max()

    min_val = min(min_true, min_pred)
    max_val = max(max_true, max_pred)

    h = plt.hist2d(
        y_true, 
        y_pred, 
        bins=bins, 
        cmap=cmap,
        range=[[min_val, max_val], [min_val, max_val]]
    )

    plt.colorbar(h[3], label="Count")

    plt.plot(
        [min_true, max_true],
        [min_true, max_true],
        'r--', 
        linewidth=2, 
        label='Perfect Prediction (x = y)'
    )

    text = f"min(y_pred): {min_pred:.3f}\nmax(y_pred): {max_pred:.3f}"
    plt.text(
        0.02, 0.98, text,
        transform=plt.gca().transAxes,
        fontsize=10,
        verticalalignment='top',
        bbox=dict(boxstyle="round", facecolor="white", alpha=0.8)
    )

    plt.xlim(min_val, max_val)
    plt.ylim(min_val, max_val)
    plt.xlabel("True Values")
    plt.ylabel("Predictions")
    plt.title("2D Histogram: True vs Predicted")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    save_path = os.path.join(save_dir, "heatmap_hist2d.png")
    plt.savefig(save_path)
    plt.show()

def plot_density_kde(y_true: np.ndarray, y_pred: np.ndarray, save_dir: str):
    plt.figure(figsize=(8, 5))
    
    sns.kdeplot(
        y_true,
        label="Human similarity",
        fill=True,
        alpha=0.5
    )

    sns.kdeplot(
        y_pred,
        label="Cosine similarity (model)",
        fill=True,
        alpha=0.5
    )

    plt.xlabel("Similarity Score")
    plt.ylabel("Density")
    plt.title("Density Plot of Cosine Similarity vs Human Scores")
    plt.grid(alpha=0.3)
    plt.legend()
    plt.tight_layout()
    save_path = os.path.join(save_dir, "density_kde.png")
    plt.savefig(save_path)
    plt.show()

def plot_calibration_curve(y_pred: np.ndarray, y_true: np.ndarray, iso: IsotonicRegression, save_dir: str):
    x_sorted = np.sort(y_pred)
    calibrated_values = iso.predict(x_sorted)

    plt.figure(figsize=(7, 5))

    plt.scatter(
        y_pred, 
        y_true,
        alpha=0.15,
        s=10,
        label="Validation data"
    )

    plt.plot(
        x_sorted, 
        calibrated_values,
        linewidth=2,
        label="Isotonic calibration"
    )

    plt.xlabel("Predicted score")
    plt.ylabel("True target")
    plt.title("Isotonic Calibration Curve")

    plt.xlim(y_pred.min(), y_pred.max())
    plt.ylim(y_true.min(), y_true.max())

    plt.legend()
    plt.grid(alpha=0.2)
    plt.tight_layout()
    save_path = os.path.join(save_dir, "calibration_curve.png")
    plt.savefig(save_path)
    plt.show()
