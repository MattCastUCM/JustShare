from keras import layers

def build_vectorizer(sentences: list[str], max_len: int):
    vectorizer = layers.TextVectorization(
        output_mode="int",
        output_sequence_length=max_len
    )
    vectorizer.adapt(sentences)
    return vectorizer
