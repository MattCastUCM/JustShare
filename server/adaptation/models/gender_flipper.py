from transformers import (
	AutoTokenizer, 
	EncoderDecoderModel
)
import torch

# https://colab.research.google.com/drive/1Ta_YkXx93FyxqEu_zJ-W23PjPumMNHe5#scrollTo=05IThl7Yipo5
class Seq2SeqGenderFlipper:
	def __init__(self, encoder_name: str = "monsoon-nlp/es-seq2seq-gender-encoder", decoder_name: str = "monsoon-nlp/es-seq2seq-gender-decoder", max_length: int = 40, device: Optional[str] = None):
		self.max_length = max_length

		self.model = EncoderDecoderModel.from_encoder_decoder_pretrained(
			encoder_name,
			decoder_name,
			# this number matters! too small and the full input will not be flipped; too long and short phrases will be slow
			max_length=max_length
		)

		# # all are same as BETO uncased original
		self.tokenizer = AutoTokenizer.from_pretrained(decoder_name)

		self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
		self.model.to(self.device)
		self.model.eval()

	def flip(self, text: str) -> str:
		return self.flip_batch([text])[0]

	def flip_batch(self, texts: list[str]) -> list[str]:
		batch = self.tokenizer(
			texts,
			return_tensors="pt",
			truncation=True,
			padding=True,
			max_length=self.max_length,
		).to(self.device)

		input_ids = batch["input_ids"]

		with torch.no_grad():
			generated = self.model.generate(
				input_ids=input_ids,
				attention_mask=batch["attention_mask"],
				decoder_start_token_id=self.model.config.decoder.pad_token_id,
			)

			outputs = []
			for i in range(generated.size(0)):
				cut = generated[i][1 : input_ids[i].shape[0] - 1]
				outputs.append(self.tokenizer.decode(cut))

		return outputs
