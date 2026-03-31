import tensorflow as tf
import pandas as pd
from keras import layers

def encode_sentences(vectorizer: layers.TextVectorization, sent1: str, sent2: str, label: float):
    return vectorizer(sent1), vectorizer(sent2), label

def create_dataset(df: pd.DataFrame, vectorizer: layers.TextVectorization, batch_size: int, shuffle: bool=False):
    sent1 = tf.constant(df["sentence1"].values)
    sent2 = tf.constant(df["sentence2"].values)
    labels = tf.constant(df["score_norm"].values, dtype=tf.float32)
    
    dataset = tf.data.Dataset.from_tensor_slices((sent1, sent2, labels))

    dataset = dataset.map(lambda sent1, sent2, y: encode_sentences(vectorizer, sent1, sent2, y),
                        num_parallel_calls=tf.data.AUTOTUNE)

    dataset = dataset.map(lambda sent1, sent2, y: ((sent1, sent2), y),
                          num_parallel_calls=tf.data.AUTOTUNE)

    if shuffle:
        dataset = dataset.shuffle(len(df))

    return dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)
