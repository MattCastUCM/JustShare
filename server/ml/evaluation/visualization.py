import matplotlib.pyplot as plt
import numpy as np

def plot_history(history_dict, save_path: str):
    plt.figure(figsize=(12, 5))

    # ---- Loss plot ----
    plt.subplot(1, 2, 1)
    plt.plot(history_dict["loss"], label="train")
    plt.plot(history_dict["val_loss"], label="validation")

    best_val_loss = np.min(history_dict["val_loss"])
    best_epoch_loss = np.argmin(history_dict["val_loss"])

    plt.scatter(best_epoch_loss, best_val_loss, color='red', s=100,
                label=f"best val_loss: {best_val_loss:.6f}")

    plt.title("Loss")
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.legend()

    # ---- MAE plot ----
    plt.subplot(1, 2, 2)
    plt.plot(history_dict["mae"], label="train")
    plt.plot(history_dict["val_mae"], label="validation")

    best_val_mae = np.min(history_dict["val_mae"])
    best_epoch_mae = np.argmin(history_dict["val_mae"])

    plt.scatter(best_epoch_mae, best_val_mae, color='red', s=100,
                label=f"best val_mae: {best_val_mae:.6f}")

    plt.title("MAE")
    plt.xlabel("Epoch")
    plt.ylabel("Mean Absolute Error")
    plt.legend()

    plt.tight_layout()
    plt.savefig(save_path)
    plt.show()

    return {
        "train_loss": history_dict["loss"][-1],
        "train_mae": history_dict["mae"][-1],
        "val_loss": history_dict["val_loss"][best_epoch_loss],
        "val_mae": history_dict["val_mae"][best_epoch_loss],
    }

def plot_histories(histories, save_path: str):
    plt.figure(figsize=(12, 5))

    # ---- Loss plot ----
    plt.subplot(1, 2, 1)
    for name, history in histories.items():
        plt.plot(history["val_loss"], label=name)
    plt.title("Validation Loss")
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.legend()

    # ---- MAE plot ----
    plt.subplot(1, 2, 2)
    for name, history in histories.items():
        plt.plot(history["val_mae"], label=name)
    plt.title("Validation MAE")
    plt.xlabel("Epoch")
    plt.ylabel("Mean Absolute Error")
    plt.legend()

    plt.tight_layout()
    plt.savefig(save_path)
    plt.show()
