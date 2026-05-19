import numpy as np
from gensim.models import KeyedVectors

def load_gensim_embeddings(wv: KeyedVectors, word2idx: dict, embed_dim: int):
	vocab_size = len(word2idx)

	# Matriz de embeddings alineada con el vocabulario
	# 0 -> PAD
	# 1 -> [UNK]
	# 2... -> Vocabulario real
	embedding_matrix = np.zeros((vocab_size, embed_dim), dtype=np.float32)

	found = 0
	for word, idx in word2idx.items():
		# [PAD] -> Se utiliza para rellenar o truncar oraciones, de modo que todas tengan un tamaño máximo
		if idx == 0:
			embedding_matrix[idx] = 0
			continue

		# [UNK] -> Token reservado para palabras que se encuentran fuera del vocabulario
		if idx == 1:
			continue

		# Si la palabra existen en el modelo preentrenado, se usa su vector correspondiente
		if word in wv.key_to_index:
			embedding_matrix[idx] = wv[word]
			found += 1

	print(f"Found {found}/{len(word2idx)} words")

	# Se toman los embeddings del vocabulario real
	known_vectors = embedding_matrix[2:]

	# Calcular la magnitud de un vector para filtrar los que tienen tamaño 0
	valid = np.linalg.norm(known_vectors, axis=1) > 0

	unk_vector = np.mean(known_vectors[valid], axis=0)

	# El segundo vector corresopnde [UNK] que se utiliza para cualquier palabra desconocida
	embedding_matrix[1] = unk_vector

	# Para las palabras que están presentes en el vocabulario del modelo, pero no en Word2Vec, se asigna el vector [UNK]
	for word, idx in word2idx.items():
		if idx > 1 and word not in wv.key_to_index:
			embedding_matrix[idx + 2] = unk_vector

	return embedding_matrix
