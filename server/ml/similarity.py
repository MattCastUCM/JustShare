from keras import ops

def l2_normalize(x, axis=1):
	norm = ops.sqrt(ops.sum(ops.square(x), axis=axis, keepdims=True))
	return x / (norm + 1e-8)

def cosine_similarity(x, y):
	x_norm = l2_normalize(x)
	y_norm = l2_normalize(y)
	return ops.sum(x_norm * y_norm, axis=1, keepdims=True)

def manhattan_similarity(x, y):
	distance = ops.sum(ops.abs(x - y), axis=1, keepdims=True)
	return ops.exp(-distance)
