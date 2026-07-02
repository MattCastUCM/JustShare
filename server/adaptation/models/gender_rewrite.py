from typing import Literal
from langchain_ollama import ChatOllama
from langchain_core.prompts import (
	ChatPromptTemplate,
	FewShotChatMessagePromptTemplate,
)
from langchain_core.output_parsers import StrOutputParser
from abc import ABC
import asyncio

Gender = Literal["masculino", "femenino"]

class BaseGenderProcessor(ABC):
	SYSTEM_PROMPT: str = ""
	USER_PROMPT: str = ""

	def __init__(self, model: str = "llama3.1:8b", temperature: float = 0.0, num_gpu: int = -1):
		self.llm = ChatOllama(
			model=model,
			temperature=temperature,
			num_gpu=num_gpu,
			validate_model_on_init=True
		)

	def _build_chain(self, examples: list[dict]):
		example_prompt = ChatPromptTemplate.from_messages([
			("human", self.USER_PROMPT),
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
	
	async def _invoke_batch(self, chain, items: list[dict[str, str]]) -> list[str]:
		tasks = [
			chain.ainvoke(item)
			for item in items
		]

		return await asyncio.gather(*tasks)

class SpeakerGenderRewrite(BaseGenderProcessor):
	SYSTEM_PROMPT = """
Eres un sistema de reescritura de texto en español.

Tu tarea es cambiar obligatoriamente el género gramatical del hablante en el texto:
- {source_gender} -> {target_gender}

DEFINICIÓN DEL HABLANTE:

El hablante es la persona que emite el mensaje. Los textos de entrada están escritos desde la perspectiva del hablante.

Se considera hablante tanto la persona expresada de forma explícita mediante formas de primera persona:
- yo
- me
- mí
- mi
- mío/mía
- conmigo
- nosotros/nosotras
- nos

como la persona que se describe a sí misma de forma implícita sin utilizar un pronombre de primera persona.

Debes cambiar únicamente las palabras o expresiones que describen, identifican o hacen referencia al propio hablante. Esto incluye cualquier marca de género que indique una característica, estado, profesión, identidad, rol, condición, valoración, actitud o situación personal del emisor, aunque la referencia al hablante esté omitida en la frase.

REGLA DE PRIMERA PERSONA IMPLÍCITA:

Cuando una expresión adjetival, participial o nominal aparezca en un texto escrito desde la perspectiva del hablante, debe interpretarse como una referencia al propio hablante salvo que exista una referencia explícita a otra persona.

Esto incluye especialmente expresiones de saludo, presentación, cortesía, agradecimiento, valoración o estado personal, como:
- "encantado" -> "encantada"
- "agradecido" -> "agradecida"
- "sorprendido" -> "sorprendida"
- "preparado" -> "preparada"
- "dispuesto" -> "dispuesta"
- "orgulloso" -> "orgullosa"

No debes modificar palabras o expresiones que hagan referencia a terceras personas.

REGLAS IMPORTANTES:

1. Cambia únicamente las palabras cuya flexión de género dependa del hablante:
	- adjetivos
	- participios
	- sustantivos
	- artículos
	- pronombres
	- determinantes
	- cuantificadores
2. No modifiques nombres propios.
3. No modifiques variables, placeholders o plantillas (por ejemplo: {{name}}).
4. Mantén el significado, el estilo, el tono y el contenido.
5. No reescribas ni resumas.
6. No añadas ni elimines información.
7. No traduzcas.
8. No corrijas errores ortográficos o gramaticales que no estén relacionados con el cambio de género.

FORMATO DE SALIDA:

Devuelve únicamente el texto transformado.
No incluyas explicaciones, comentarios ni etiquetas.
"""

	USER_PROMPT = """
Transforma obligatoriamente el siguiente texto cambiando el género gramatical del hablante de
{source_gender} a {target_gender}.

Texto:

{text}

Devuelve únicamente el texto transformado.
"""

	MALE_TO_FEMALE_EXAMPLES = [
		{
			"source_gender": "masculino",
			"target_gender": "femenino",
			"text": "Encantado, soy Carlos.",
			"output": "Encantada, soy Carlos.",
		},
		{
			"source_gender": "masculino",
			"target_gender": "femenino",
			"text": "Estoy contento de conocerte.Estoy contento de conocerte.",
			"output": "Estoy contenta de conocerte.",
		},
		{
			"source_gender": "masculino",
			"target_gender": "femenino",
			"text": "Soy un profesor nuevo aquí.",
			"output": "Soy una profesora nueva aquí.",
		},
		{
			"source_gender": "masculino",
			"target_gender": "femenino",
			"text": "Estoy muy cansado hoy.",
			"output": "Estoy muy cansada hoy.",
		},
		{
			"source_gender": "masculino",
			"target_gender": "femenino",
			"text": "Un placer conocerte, encantado de estar aquí.",
			"output": "Un placer conocerte, encantada de estar aquí.",
		}
	]

	FEMALE_TO_MALE_EXAMPLES = [
		{
			"source_gender": "femenino",
			"target_gender": "masculino",
			"text": "Encantada, soy Laura.",
			"output": "Encantado, soy Laura."
		},
		{
			"source_gender": "femenino",
			"target_gender": "masculino",
			"text": "Estoy contenta de conocerte.",
			"output": "Estoy contento de conocerte."
		},
		{
			"source_gender": "femenino",
			"target_gender": "masculino",
			"text": "Soy una profesora nueva aquí.",
			"output": "Soy un profesor nuevo aquí."
		},
		{
			"source_gender": "femenino",
			"target_gender": "masculino",
			"text": "Estoy muy cansada hoy.",
			"output": "Estoy muy cansado hoy."
		},
		{
			"source_gender": "femenino",
			"target_gender": "masculino",
			"text": "Un placer conocerte, encantada de estar aquí.",
			"output": "Un placer conocerte, encantado de estar aquí.",
		}
	]

	def _build_chain(self, source_gender: Gender, target_gender: Gender):
		examples = []

		if source_gender == "masculino" and target_gender == "femenino":
			examples = self.MALE_TO_FEMALE_EXAMPLES

		elif source_gender == "femenino" and target_gender == "masculino":
			examples = self.FEMALE_TO_MALE_EXAMPLES

		return super()._build_chain(examples)

	async def rewrite(self, text: str, source_gender: Gender = "masculino", target_gender: Gender = "femenino") -> str:
		if source_gender == target_gender:
			return text

		chain = self._build_chain(
			source_gender=source_gender,
			target_gender=target_gender,
		)

		return await chain.ainvoke({
			"text": text,
			"source_gender": source_gender,
			"target_gender": target_gender,
		})
	
	async def rewrite_batch(self, texts: list[str], source_gender: Gender = "masculino", target_gender: Gender = "femenino") -> list[str]:
		chain = self._build_chain(
			source_gender,
			target_gender,
		)

		items = [
            {
                "text": text,
                "source_gender": source_gender,
                "target_gender": target_gender,
            }
            for text in texts
        ]

		return await self._invoke_batch(chain, items)
	
class GenderAdjustment(BaseGenderProcessor):
	SYSTEM_PROMPT = """
Eres un sistema de reescritura en español.

Tu tarea es identificar todas las referencias a una persona identificada por su nombre propio. Modifica las palabras cuya concordancia de género dependa de esa persona para que concuerden con el género indicado.

No debes realizar ninguna otra modificación.

REGLAS IMPORTANTES:

1. Corrige todas las referencais a la persona indicada, incluyendo:
	- pronombres
	- artículos
	- adjetivos
	- participios
	- sustantivos
	- determinantes
	- cuantificadores
2. No modifiques el nombre propio.
3. No modifiques variables, placeholders o plantillas (por ejemplo: {{name}}).
4. No modifiques las referencias a otras personas o entidades.
5. Mantén el significado, el estilo, el tono y el contenido.
6. No reescribas ni resumas.
7. No añadas ni elimines información.
8. No traduzcas.
9. No corrijas errores ortográficos o gramaticales que no estén relacionados con el género.

La salida debe contener únicamente el texto transformado.
"""

	USER_PROMPT = """
Ajusta el siguiente texto para que todas las referencias a la siguiente persona concuerden con el género indicado.

Persona:
- {name}: {gender}

Texto:

{text}

Devuelve únicamente el texto corregido.
"""

	MALE_GENDER_ADJUSTMENT_EXAMPLES = [
		{
			"name": "Pablo",
			"gender": "masculino",
			"text": "No creo que la conozcas, va a otro insti, se llama Pablo.",
			"output": "No creo que lo conozcas, va a otro insti, se llama Pablo."
		},
		{
			"name": "Pablo",
			"gender": "masculino",
			"text": "Pablo está muy cansada y preparada para empezar.",
			"output": "Pablo está muy cansado y preparado para empezar."
		},
		{
			"name": "Pablo",
			"gender": "masculino",
			"text": "Conocí a Pablo ayer. Es una profesora excelente.",
			"output": "Conocí a Pablo ayer. Es un profesor excelente.",
		},
		{
			"name": "Pablo",
			"gender": "masculino",
			"text": "Le dije a Pablo que estaba preocupada por el examen.",
			"output": "Le dije a Pablo que estaba preocupado por el examen.",
		},
	]


	FEMALE_GENDER_ADJUSTMENT_EXAMPLES = [
		{
			"name": "Lucía",
			"gender": "femenino",
			"text": "No creo que lo conozcas, va a otro insti, se llama Lucía.",
			"output": "No creo que la conozcas, va a otro insti, se llama Lucía."
		},
		{
			"name": "Lucía",
			"gender": "femenino",
			"text": "Lucía está muy cansado y preparado para empezar.",
			"output": "Lucía está muy cansada y preparada para empezar."
		},
		{
			"name": "Lucía",
			"gender": "femenino",
			"text": "Conocí a Lucía ayer. Es un profesor excelente.",
			"output": "Conocí a Lucía ayer. Es una profesora excelente."
		},
		{
			"name": "Lucía",
			"gender": "femenino",
			"text": "Le dije a Lucía que estaba preocupado por el examen.",
			"output": "Le dije a Lucía que estaba preocupada por el examen."
		},
	]
	
	def _build_chain(self, gender: Gender):
		examples = self.MALE_GENDER_ADJUSTMENT_EXAMPLES

		if gender == "femenino":
			examples = self.FEMALE_GENDER_ADJUSTMENT_EXAMPLES

		return super()._build_chain(examples)

	async def adjust(self, text: str, name: str, gender: Gender) -> str:
		chain = self._build_chain(gender)

		return await chain.ainvoke({
			"text": text,
			"name": name,
			"gender": gender,
		})
	
	async def adjust_batch(self, texts: list[str], name: str, gender: Gender) -> list[str]:
		chain = self._build_chain(gender)

		items = [
            {
                "text": text,
                "name": name,
                "gender": gender,
            }
            for text in texts
        ]

		return await self._invoke_batch(chain, items)
	