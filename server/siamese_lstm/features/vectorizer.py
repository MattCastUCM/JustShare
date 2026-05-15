from keras import layers
import tensorflow as tf

def custom_standardization(text: str) -> str:
    text = tf.strings.lower(text)
    text = tf.strings.regex_replace(text, r"[^\w\s]", "")  # quitar puntuación
    text = tf.strings.regex_replace(text, r"\s+", " ")     # espacios múltiples
    text = tf.strings.strip(text)                           # trim
    return text

def build_vectorizer(sentences: list[str], max_len: int):
    vectorizer = layers.TextVectorization(
        output_mode="int",
        output_sequence_length=max_len,
        standardize=custom_standardization
    )

    vectorizer.adapt(sentences)
    return vectorizer