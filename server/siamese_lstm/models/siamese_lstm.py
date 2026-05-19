from typing import Literal, Optional
import numpy as np
from keras import Model, layers
import keras
from keras import ops
from utils.vector_keras import manhattan_similarity, cosine_similarity

class SiameseLSTM(Model):
	def __init__(self, vocab_size: int, embedding_dim: int, hidden_dim: int, mlp_dropout: float, lstm_dropout: float, embedding_matrix: Optional[np.ndarray] = None, pooling: Literal["last", "mean"] = "mean", similarity: Literal["manhattan", "cosine", "mlp"] = "cosine", mlp_layers: list[int] = [], bidirectional: bool = False, concat_features: list[Literal["vec1", "vec2", "diff", "prod"]] = ["diff", "prod"], name="siamese_lstm", **kwargs):
		super().__init__(name=name, **kwargs)

		self.vocab_size = vocab_size
		self.embedding_dim = embedding_dim
		self.hidden_dim = hidden_dim
		self.pooling = pooling
		self.similarity = similarity
		self.bidirectional = bidirectional
		self.mlp_layers = mlp_layers
		self.concat_features = concat_features
		self.mlp_dropout = mlp_dropout
		self.lstm_dropout = lstm_dropout

		if embedding_matrix is not None:
			initializer = keras.initializers.Constant(embedding_matrix)
			trainable = False
		else:
			initializer = "uniform"
			trainable = True	

		# Cuando se usa mask_zero=True, queda así:
		# 0 -> [PAD]
		# 1 -> [UNK]
		# 2... -> Vocabulario real
		self.embedding = layers.Embedding(
			input_dim=vocab_size,
			output_dim=embedding_dim,
			embeddings_initializer=initializer,
			trainable=trainable,
			mask_zero=True,
			name="embedding"
		)

		lstm_layer = layers.LSTM(
			hidden_dim,
			return_sequences=True,
			dropout=lstm_dropout,
			recurrent_dropout=lstm_dropout,
		)

		if bidirectional:
			self.lstm = layers.Bidirectional(lstm_layer, name="bilstm")
		else:
			self.lstm = lstm_layer

		if similarity == "mlp":
			mlp_seq = []

			base_dim = hidden_dim * (2 if bidirectional else 1)
			input_dim = base_dim * len(concat_features)
			mlp_seq.append(layers.Input(shape=(input_dim,)))

			if mlp_layers:
				for unit in mlp_layers:
					mlp_seq.append(layers.Dense(unit, activation="relu"))
					mlp_seq.append(layers.Dropout(mlp_dropout))

				mlp_seq.append(layers.Dense(1, activation="sigmoid"))
			else:
				mlp_seq.append(layers.Dense(1, activation="sigmoid"))

			self.mlp = keras.Sequential(mlp_seq, name="mlp")
		else:
			self.mlp = None

	def masked_mean_pool(self, hidden_states, mask):
		# mask (batch, seq_len)
		mask = ops.cast(mask, hidden_states.dtype)

		# Expandir máscara para que coincida con el estado oculto
		# (batch, seq_len) -> (batch, seq_len, 1)
		mask = ops.expand_dims(mask, axis=-1)

		# hidden_states (batch, seq_len, 1)
		# mask (batch, seq_len, hidden_dim)
		masked_hidden = hidden_states * mask

		sum_hidden = ops.sum(masked_hidden, axis=1)
		# Contar el número de palabras sin padding
		token_count = ops.sum(mask, axis=1)

		return sum_hidden / (token_count + 1e-8)

	def pool(self, x, mask):
		if self.pooling == "last":
			# Si hay padding, se copia el estado anterior
			return x[:, -1, :]
		elif self.pooling == "mean":
			return self.masked_mean_pool(x, mask)
	
	def compute_similarity(self, x, y):
		if self.similarity == "manhattan":
			return manhattan_similarity(x, y)
		elif self.similarity == "cosine":
			return cosine_similarity(x, y)
		
	def call(self, inputs, training=False):
		sent1, sent2 = inputs

		emb1 = self.embedding(sent1)
		emb2 = self.embedding(sent2)

		mask1 = self.embedding.compute_mask(sent1)
		mask2 = self.embedding.compute_mask(sent2)

		lstm_out1 = self.lstm(emb1, training=training)
		lstm_out2 = self.lstm(emb2, training=training)	

		vec1 = self.pool(lstm_out1, mask1)
		vec2 = self.pool(lstm_out2, mask2)	

		if self.similarity == "mlp" and self.mlp:
			tensors_to_concat = []

			if "vec1" in self.concat_features:
				tensors_to_concat.append(vec1)
			if "vec2" in self.concat_features:
				tensors_to_concat.append(vec2)
			if "diff" in self.concat_features:
				tensors_to_concat.append(ops.abs(vec1 - vec2))
			if "prod" in self.concat_features:
				tensors_to_concat.append(vec1 * vec2)
			
			concat = ops.concatenate(tensors_to_concat, axis=1)
			return self.mlp(concat, training=training)
		else:
			return self.compute_similarity(vec1, vec2)
	
	def get_config(self):
		settings = super().get_config()
		settings.update({
			"vocab_size": self.vocab_size,
			"embedding_dim": self.embedding_dim,
			"hidden_dim": self.hidden_dim,
			"pooling": self.pooling,
			"similarity": self.similarity,
			"mlp_layers": self.mlp_layers,
			"bidirectional": self.bidirectional,
			"concat_features": self.concat_features,
			"mlp_dropout": self.mlp_dropout,
			"lstm_dropout": self.lstm_dropout,
		})
		return settings
	
	@classmethod
	def from_config(cls, settings):
		return cls(**settings, embedding_matrix=None)
	
	def get_head_model(self):
		input_sent = layers.Input(shape=(None,))
		emb = self.embedding(input_sent)
		mask = self.embedding.compute_mask(input_sent)
		lstm_out = self.lstm(emb, training=False)
		vec = self.pool(lstm_out, mask)
		return Model(inputs=input_sent, outputs=vec, name="siamese_head")
	