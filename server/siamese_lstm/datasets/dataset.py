import tensorflow as tf
import pandas as pd
from features.vectorizer import TextVectorizerModel

def encode_sentences(vectorizer: TextVectorizerModel, sent1, sent2, label):
    return (
        vectorizer.vectorizer(sent1),
        vectorizer.vectorizer(sent2),
        label
    )

def create_dataset(df: pd.DataFrame, vectorizer: TextVectorizerModel, batch_size: int, shuffle: bool = False):
    sent1 = vectorizer.preprocess(df["sentence1"].tolist())

    sent2 = vectorizer.preprocess(df["sentence2"].tolist())

    labels = tf.constant(df["score_norm"].values, dtype=tf.float32)

    dataset = tf.data.Dataset.from_tensor_slices((sent1, sent2, labels))

    dataset = dataset.map(
        lambda sent1, sent2, y: encode_sentences(
            vectorizer,
            sent1,
            sent2,
            y
        ),
        num_parallel_calls=tf.data.AUTOTUNE
    )

    dataset = dataset.map(
        lambda sent1, sent2, y: (
            (sent1, sent2),
            y
        ),
        num_parallel_calls=tf.data.AUTOTUNE
    )

    if shuffle:
        dataset = dataset.shuffle(len(df))

    return (
        dataset
        .batch(batch_size)
        .prefetch(tf.data.AUTOTUNE)
    )
