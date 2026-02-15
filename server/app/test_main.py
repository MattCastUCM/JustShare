from .main import create_similarity_engine
import numpy as np
from .schemas.similarity import SimilarityMatch

def main():
	similarity_engine = create_similarity_engine(max_n=2)
	
	corpus = [
		"¡Gracias! Si necesito algo, te aviso.",
		"Igualmente, un gusto conocerte *sonríes*.",
		"Ah, sí... ¡hola!",
		"Gracias, cualquier cosa te cuento.",
		"Perfecto, muchas gracias.",
		"Igualmente, encantado de conocerte.",
		"Encantado de conocerte también.",
		"El gusto es mío.",
		"Jaja, ¡hola!",
		"Ah, sí... hola.",
		"Perdón, me colgué un poco... hola.",
		"Hola, ¿qué tal?",
		"Hey, hola.",
		"Ah, cierto... hola.",
		"Todo bien, gracias.",
		"Mucho gusto.",
		"Encantado, un placer conocerte.",
		"Hola, hola.",
		"Ups... ¡hola!",
		"Ah, sí, perdón... hola."
	]
	
	text = "hola, amiga, encantado de conocerte"
	scores = similarity_engine.similarity_transformer(
		corpus=corpus, 
		text=text,
		language="es",
		model_type="sentence",
		pooling="mean"
	)

	scores = scores.reshape(-1)
	top_indexes = np.argsort(-scores)[:1]

	matches = [
		SimilarityMatch(
			index=int(index),
			score=float(scores[index]),
			text=corpus[index]
		)
		for index in top_indexes
	]

	print(matches)

if __name__ == "__main__":
	main()