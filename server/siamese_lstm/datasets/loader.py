from typing import Callable
from models.siamese_lstm import SiameseLSTM
import pandas as pd
import numpy as np
import json
import os

def load_splits(split_dirs: dict):
    dfs = {}
    for split, dir in split_dirs.items():
        path = f"{dir}/stsb-es-{split}.csv"
        dfs[split] = pd.read_csv(path)

    return dfs

def save_splits(dataframe: pd.DataFrame, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    for split, data in dataframe.groupby("split"):
        path = os.path.join(output_dir, f"stsb-es-{split}.csv")
        data.to_csv(path, index=False)

def load_files(root_dir: str, filename: str, loader: Callable):
    data_dict = {}
    for dirpath, _, filenames in os.walk(root_dir):
        for f in filenames:
            if f == filename:
                file_path = os.path.join(dirpath, f)
                data = loader(file_path)
                key = os.path.basename(dirpath)
                data_dict[key] = data
    return data_dict

def load_npy_file(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"NPY file not found: {path}")

    try:
        data = np.load(path, allow_pickle=True)
        if hasattr(data, "item"):
            return data.item()
        raise ValueError(f"NPY file does not contain a dictionary: {path}")
    except Exception as e:
        raise RuntimeError(f"Failed to load NPY file: {path}") from e

def load_json_file(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"JSON file not found: {path}")

    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format in file: {path}") from e
    except Exception as e:
        raise RuntimeError(f"Failed to load JSON file: {path}") from e
    
def save_json(data, path: str, indent: int=4, ensure_ascii: bool=True):
    try:
        json_str = json.dumps(data, indent=indent, ensure_ascii=ensure_ascii)
        with open(path, "w", encoding="utf-8") as f:
            f.write(json_str)
    except Exception as e:
        raise RuntimeError(f"Failed to save JSON file: {path}") from e
    
def _extract_metrics(prefix: str, source: dict, keys: list[str]):
    return {f"{prefix}_{k}": source.get(k) for k in keys}

def _extract_model_attrs(model, attrs: list[str]):
    return {attr: getattr(model, attr, None) for attr in attrs}

def save_metrics(model: SiameseLSTM, config_path: str, metrics_path: str, history_metrics: dict, test_metrics: dict, calibration_metrics: dict):
    config = load_json_file(config_path)

    model_attrs = [
        "name",
        "hidden_dim",
        "embedding_dim",
        "pooling",
        "similarity",
        "bidirectional",
        "mlp_layers",
        "concat_features",
        "mlp_dropout",
        "lstm_dropout",
    ]

    history_keys = ["train_loss", "train_mae", "val_loss", "val_mae"]
    eval_keys = ["pearson", "spearman", "mse", "mae", "rmse", "bias", "r2"]

    metrics = {
        **_extract_model_attrs(model, model_attrs),

        "sequence_length": config.get("sequence_length"),
        "data_augmentation": config.get("data_augmentation"),
        "train_time_s": config.get("train_time_s"),

        **{k: history_metrics.get(k) for k in history_keys},

        **_extract_metrics("test", test_metrics, eval_keys),

        **_extract_metrics("calibration", calibration_metrics, eval_keys)
    }

    save_json(metrics, metrics_path)

