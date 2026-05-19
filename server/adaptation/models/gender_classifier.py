from transformers import (
	AutoTokenizer, 
	AutoModelForSequenceClassification, 
)
import torch

class GenderClassifier:
	def __init__(self, model_name: str = "IsGarrido/gender_classifier_es_roberta_base", device = None):
		self.model_name = model_name

		self.tokenizer = AutoTokenizer.from_pretrained(model_name)
		self.model = AutoModelForSequenceClassification.from_pretrained(model_name)

		self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
		self.model.to(self.device)
		self.model.eval()

		self.id2label = self.model.config.id2label

	def predict(self, text: str, return_all_scores: bool = True):
		return self.predict_batch([text], return_all_scores=return_all_scores)[0]

	def predict_batch(self, texts: list[str], return_all_scores: bool = True):
		inputs = self.tokenizer(
			texts,
			return_tensors="pt",
			padding=True,
			truncation=True
		).to(self.device)

		with torch.no_grad():
			outputs = self.model(**inputs)

		logits = outputs.logits
		# Convertir logits a probabilidades ([-infinito, infinito] --> [0,1])
		probs = torch.softmax(logits, dim=1)

		results = []

		for i in range(len(texts)):
			prob = probs[i]
			predicted_class_id = torch.argmax(prob).item()
			label = self.id2label[predicted_class_id]

			result = {
				"label": label,
				"class_id": predicted_class_id,
				"confidence": float(prob[predicted_class_id])
			}

			if return_all_scores:
				result["all_scores"] = {
					self.id2label[j]: float(prob[j])
					for j in range(len(prob))
				}

			results.append(result)

		return results

	def print_prediction(self, text):
		result = self.predict(text)

		print("Predicted class:", result["label"])
		print(f"Confidence: {result['confidence']:.4f}")

		print("\nConfidence scores:")
		for label, score in result["all_scores"].items():
			print(f"{label}: {score:.4f}")
			