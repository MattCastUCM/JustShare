from keras import layers
from keras.saving import register_keras_serializable
import tensorflow as tf

# Se guarda en el registro global
@register_keras_serializable(package="custom")
def custom_standardization(text: str) -> str:
    text = tf.strings.lower(text)

    # Reemplazar puntuación por espacio
    text = tf.strings.regex_replace(text, r"[^\w\s]", " ")
    # Compactar espacios
    text = tf.strings.regex_replace(text, r"\s+", " ")
    # Trim
    text = tf.strings.strip(text)

    return text

def build_vectorizer(sentences: list[str], max_len: int):
    vectorizer = layers.TextVectorization(
        output_mode="int",
        output_sequence_length=max_len,
        standardize=custom_standardization
    )

    vectorizer.adapt(sentences)
    return vectorizer