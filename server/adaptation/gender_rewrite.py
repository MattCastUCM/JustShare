from typing import Literal
from langchain_ollama import ChatOllama
from langchain_core.prompts import (
	ChatPromptTemplate,
	FewShotChatMessagePromptTemplate,
)
from langchain_core.output_parsers import StrOutputParser
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

Gender = Literal["masculino", "femenino"]

class GenderRewrite:
	SYSTEM_PROMPT = """
Eres un sistema de reescritura de texto en español.

Tu tarea es cambiar el género gramatical del hablante en el texto:
- {source_gender} -> {target_gender}

REGLAS IMPORTANTES:
1. Cambia TODAS las formas de género (adjetivos, participios, sustantivos relacionados con el hablante).
2. Mantén el significado, el estilo, el tono y el contenido.
3. No reescribas ni resumas.
4. No elimines información.
5. No cambies el idioma.
6. No cambies el nombre propio ni entidades.
7. Si el texto es neutro, devuélvelo igual.

OBJETIVO:
Asegurar coherencia gramatical completa tras el cambio de género.
"""

	USER_PROMPT = """
Reescribe el siguiente texto cambiando el género gramatical del hablante:

{text}

Devuelve SOLO el texto corregido.
"""

	MALE_TO_FEMALE_EXAMPLES = [
		{
			"input": "Encantado, soy Carlos.",
			"output": "Encantada, soy Carlos.",
		},
		{
			"input": "Estoy contento de conocerte.",
			"output": "Estoy contenta de conocerte.",
		},
		{
			"input": "Soy un profesor nuevo aquí.",
			"output": "Soy una profesora nueva aquí.",
		},
		{
			"input": "Estoy muy cansado hoy.",
			"output": "Estoy muy cansada hoy.",
		},
	]

	FEMALE_TO_MALE_EXAMPLES = [
		{
			"input": "Encantada, soy Laura.",
			"output": "Encantado, soy Laura.",
		},
		{
			"input": "Estoy contenta de conocerte.",
			"output": "Estoy contento de conocerte.",
		},
		{
			"input": "Soy una profesora nueva aquí.",
			"output": "Soy un profesor nuevo aquí.",
		},
		{
			"input": "Estoy muy cansada hoy.",
			"output": "Estoy muy cansado hoy.",
		},
	]

	NEUTRAL_EXAMPLES = [
		{
			"input": "El sistema funciona correctamente.",
			"output": "El sistema funciona correctamente.",
		}
	]

	def __init__(self, model: str = "llama3.1:8b", temperature: float = 0.2, num_gpu: int = -1, max_workers: int = 8):
		self.max_workers = max_workers

		self.llm = ChatOllama(
			model=model,
			temperature=temperature,
			num_gpu=num_gpu,
		)

	@lru_cache(maxsize=8)
	def _build_chain(self, source_gender: Gender, target_gender: Gender):
		examples = list(self.NEUTRAL_EXAMPLES)

		if source_gender.lower() == "masculino" and target_gender.lower() == "femenino":
			examples += self.MALE_TO_FEMALE_EXAMPLES

		elif source_gender.lower() == "femenino" and target_gender.lower() == "masculino":
			examples += self.FEMALE_TO_MALE_EXAMPLES

		example_prompt = ChatPromptTemplate.from_messages([
			("human", "{input}"),
			("ai", "{output}"),
		])

		few_shot_prompt = FewShotChatMessagePromptTemplate(
			example_prompt=example_prompt,
			examples=examples,
		)

		prompt = ChatPromptTemplate.from_messages([
			("system", self.SYSTEM_PROMPT),
			few_shot_prompt,
			("user", self.USER_PROMPT),
		])

		parser = StrOutputParser()

		return prompt | self.llm | parser

	def rewrite(self, text: str, source_gender: Gender = "masculino", target_gender: Gender = "femenino") -> str:
		if source_gender == target_gender:
			return text

		chain = self._build_chain(
			source_gender=source_gender,
			target_gender=target_gender,
		)

		response = chain.invoke({
			"text": text,
			"source_gender": source_gender,
			"target_gender": target_gender,
		})

		return response
	
	def rewrite_batch(self, texts: list[str], source_gender: Gender = "masculino", target_gender: Gender = "femenino") -> list[str]:

		chain = self._build_chain(
			source_gender,
			target_gender,
		)

		def run(text):
			response = chain.invoke({
				"text": text,
				"source_gender": source_gender,
				"target_gender": target_gender,
			})

			return response

		with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
			return list(executor.map(run, texts))
	