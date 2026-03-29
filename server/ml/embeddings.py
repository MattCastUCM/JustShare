import gensim
import numpy as np

def load_gensim_embeddings(path: str, word2idx: dict, embed_dim: int):
	wv = gensim.models.KeyedVectors.load(path, mmap="r")
	embedding_matrix = np.random.uniform(-0.05, 0.05, (len(word2idx), embed_dim))
	# El índice 0 se utiliza como padding token, por lo que tiene un vector de ceros, para indicar que no contribuye
	embedding_matrix[0] = 0
	found = 0
	for word, idx in word2idx.items():
		if word in wv.key_to_index:
			embedding_matrix[idx] = wv[word]
			found += 1
	print(f"Found {found}/{len(word2idx)} words.")
	return embedding_matrix

