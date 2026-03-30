import pandas as pd
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
    