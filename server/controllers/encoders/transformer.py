from transformers import AutoTokenizer, AutoModel
import torch
from typing import Optional
from controllers.encoders.encoder import Encoder
from enum import StrEnum

class PoolingMethod(StrEnum):
	MEAN = "mean"
	MAX = "max"
	CLS = "cls"

class Transformer(Encoder):
	name = "transformer"

	def __init__(self, model_name: str, device: Optional[str] = None, pooling_method: PoolingMethod = PoolingMethod.MEAN):
		self.device = device if device else ("cuda" if torch.cuda.is_available() else "cpu")
		print("Using device:", self.device)

		self.tokenizer = AutoTokenizer.from_pretrained(model_name)
		self.model = AutoModel.from_pretrained(model_name).to(self.device)
		self.model.eval()

		self.pooling_method = pooling_method

	# Mean pooling captura el contenido semántico general promediando todos los word embeddings.
	def mean_pooling(self, model_output, attention_mask):
		# token_embeddings = model_output[0]
		token_embeddings = model_output["last_hidden_state"]
		# Modificar el pooling para tener en cuenta la máscara de atención. Esta máscara es un vector de 0 y 1 que indica qué tokens son reales y cuáles son de relleno. Queremos ignorar los paddings tokens al calcular la media.
		input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
		return torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(
			input_mask_expanded.sum(1), min=1e-9
		)
	
	# Max pooling toma los valores máximos de cada dimensión de los word embeddings.
	# Sin embargo, puede hacer que el embedding de la oración sea menos equilbirado porque dos oraciones pueden compartir palabras importante pero diferir en otras, lo que exagera las diferencias del max pooling.
	def max_pooling(self, model_output, attention_mask):
		token_embeddings = model_output["last_hidden_state"]
		input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
		
		# Enmascara los padding tokens con un número negativo muy grande para que se ignoren en el máximo.
		token_embeddings[input_mask_expanded == 0] = -1e9
		return torch.max(token_embeddings, dim=1).values
	
	# [CLS] pooling consiste en usar el embedding del primer token de la secuencia como el embedding de la oración.
	# Este token está diseñado para capturar una representación global de la oración, ya que durante el preentrenamiento
	# se utiliza para tareas como:
	#   - Next Sentence Prediction
	# Sin embargo, el embedding [CLS] no fue entrenado para específicamente para tareas de similitud semántica.
	# Por esto, en muchos casos el mean pooling produce mejores embeddings para comparaciones de oraciones.
	
	# Some weights of BertModel were not initialized from the model checkpoint at dccuchile/bert-base-spanish-wwm-cased and are newly initialized: ['pooler.dense.bias', 'pooler.dense.weight'].
	# You should probably TRAIN this model on a down-stream task to be able to use it for predictions and inference.
	def cls_pooling(self, model_output):
		# Algunos modelos, como BERT, incluyen "pooler_output", que corresponde 
		# al embedding del token [CLS] después de pasar por una capa lineal y una activación tanh.
		if "pooler_output" in model_output:
			return model_output["pooler_output"]
		else:
			return model_output["last_hidden_state"][:, 0]
		
	def fit(self, sentences: list[str]):
		pass

	def _transform(self, sentences: list[str]):
		# Modificar la tokenización para aplicar "truncation" (cortar la oración si es más larga que la longitud máxima) y "padding" (agregar [PAD] tokens al final de la oración).
		encoded_input = self.tokenizer(
			sentences,
			padding=True,
			truncation=True,
			return_tensors="pt"
		).to(self.device)

		with torch.no_grad():
			model_output = self.model(**encoded_input)

			match self.pooling_method:
				case PoolingMethod.MEAN:
					sentence_embeddings = self.mean_pooling(model_output, encoded_input["attention_mask"])
				case PoolingMethod.MAX:
					sentence_embeddings = self.max_pooling(model_output, encoded_input["attention_mask"])
				case PoolingMethod.CLS:
					sentence_embeddings = self.cls_pooling(model_output)			

			return sentence_embeddings.detach().cpu().numpy()
