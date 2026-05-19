from keras import ops

def l2_normalize(vec):
	norm = ops.norm(vec, ord=2, axis=1, keepdims=True)
	return vec / norm

def cosine_similarity(vec1, vec2):
	vec1_norm = l2_normalize(vec1)
	vec2_norm = l2_normalize(vec2)
	return ops.sum(vec1_norm * vec2_norm, axis=1, keepdims=True)

def manhattan_similarity(vec1, vec2):
	# Se convierte la distancia manhattan a una similitud usando la función exponencial
	distance = ops.sum(ops.abs(vec1 - vec2), axis=1, keepdims=True)
	return ops.exp(-distance)
