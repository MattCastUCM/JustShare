from typing import Callable
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


def load_history_file(file_path: str) -> dict:
    return np.load(file_path, allow_pickle=True).item()

def load_metrics_file(file_path: str) -> dict:
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)
