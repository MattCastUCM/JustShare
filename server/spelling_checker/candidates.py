from typing import Optional
import pickle
from abc import ABC, abstractmethod
from distances import damerau_levenshtein
from collections import defaultdict

class CandidateGenerator(ABC):
	def __init__(self, max_dist: int):
		self.max_dist = max_dist

	@abstractmethod
	def add(self, word: str) -> None:
		pass
	
	@abstractmethod
	def search(self, query: str, max_dist: int) -> list[tuple[str, int]]:
		pass

	def save(self, path: str):
		with open(path, 'wb') as f:
			pickle.dump(self, f)

	@classmethod
	def load(cls, path: str) -> 'CandidateGenerator':
		with open(path, 'rb') as f:
			return pickle.load(f)

class BKNode:
	# Python almacena los atributos de una clase en un __dict__, lo que permite guardar más elementos posteriormente. Se puede usar __slots__ para evitar este comportamiento y fijar los atributos desde el principio
	__slots__ = ("word", "length", "children")
	def __init__(self, word: str):
		self.word = word
		self.length = len(word)
		self.children: dict[int, BKNode] = {}

# https://www.geeksforgeeks.org/dsa/bk-tree-introduction-implementation/
class BKTree(CandidateGenerator):
	def __init__(self, max_dist: int = 2):
		self.root: BKNode | None = None
		self.max_dist = max_dist

	def add(self, word: str):
		if self.root is None:
			self.root = BKNode(word)
			return

		node = self.root

		while True:
			dist = damerau_levenshtein(
				word,
				node.word
			)
			
			if dist in node.children:
				node = node.children[dist]
			else:
				node.children[dist] = BKNode(word)
				return

	# def search(self, query: str) -> list[tuple[str, int]]:
	# 	results = []

	# 	def recurse(node: BKNode):
	# 		dist = self.distance(
	# 			query,
	# 			node.word,
	# 			self.max_distance
	# 		)
			
	# 		if dist <= self.max_distance:
	# 			results.append((node.word, dist))

	# 	# Desigualdad triangular:
	# 	# Para cualquier distancia (como Damerau-Levenshtein):
	# 	#
	# 	#   d(query, child) >= |d(query, node) - d(node, child)|
	# 	#
	# 	# En un BK-tree:
	# 	#   - dist 	= d(query, node)
	# 	#   - e 	= d(node, child)
	# 	#
	# 	# Queremos saber qué hijos pueden estar a distancia <= max_distance de la query:
	# 	#
	# 	#   d(query, child) <= max_distance
	# 	#   Usando la desigualdad triangular: |dist - e| <= max_distance
	# 	#
	# 	# Despejando e:
	# 	#
	# 	#   -max_distance <= dist - e <= max_distance
	# 	#
	# 	# Restamos dist en toda la desigualdad:
	# 	#
	# 	#   -max_distance - dist <= -e <= max_distance - dist
	# 	#
	# 	# Hacemos el "flip" de signo (multiplicamos por -1):
	# 	#
	# 	#	dist + max_distance >= e >= dist - max_distance
	# 	#
	# 	# Reordenando:
	# 	#
	# 	#	dist - max_distance <= e <= dist + max_distance
	# 	#
	# 	# Ejemplo:
	# 	#   query = "casaa"
	# 	#   node  = "casa"
	# 	#   dist  = 1
	# 	#   max_distance = 2
	# 	#
	# 	# Entonces:
	# 	#   1 - 2 <= e <= 1 + 2
	# 	#   -1 <= e <= 3
	# 	#
	# 	# Solo exploramos hijos con etiquetas en ese rango.
	# 		low = dist - self.max_distance
	# 		high = dist + self.max_distance

	# 		for edge, child in node.children.items():
	# 			if low <= edge <= high:
	# 				recurse(child)

	# 	if self.root:
	# 		recurse(self.root)

	# 	return results
	
	def search(self, query: str, max_dist: Optional[int] = None) -> list[tuple[str, int]]:
		if max_dist is None:
			max_dist = self.max_dist

		if self.root is None:
			return []

		results = []
		stack = [self.root]

		while stack:
			node = stack.pop()

			dist = damerau_levenshtein(query, node.word)
			if dist <= max_dist:
				results.append((node.word, dist))

			low = dist - max_dist
			high = dist + max_dist

			for edge, child in node.children.items():
				# quick length filter
				if low <= edge <= high:
					stack.append(child)

		return results

# https://ieeexplore.ieee.org/document/9678171
class SymSpell(CandidateGenerator):
	def __init__(self, max_dist: int = 2, prefix_length: int = 7):
		self.max_dist = max_dist
		self.prefix_length = prefix_length
		# # Asigna cada palabra con caracteres borrado un número de veces a la lista de palabras del diccionario original
		self.deletes = defaultdict(set)
		# Se utiliza un diccionario de texto a identificador para reducir el consumo de memoria, ya que habrá muchas palabras repetidas
		self.word_list = []
		self.word_to_id = {}

	def add(self, word: str):
		if word not in self.word_to_id:
			idx = len(self.word_list)
			self.word_list.append(word)
			self.word_to_id[word] = idx
		else:
			idx = self.word_to_id[word]

		delete_keys = self._generate_deletes(word, self.max_dist)
		for key in delete_keys:
			self.deletes[key].add(idx)

	def _generate_deletes(self, word: str, dist: int) -> set[str]:
		# Genera recursivamente todas las cadenas formadas eliminando 0..dist caracteres
		keys = set()
		# La propia palabra tiene una distancia de 0
		keys.add(word)
		if dist == 0:
			return keys

		for i in range(len(word)):
			# Dejar de eliminar después de una longitud determinada, para optimizar
			if i > self.prefix_length:
				break
			shorter = word[:i] + word[i+1:]
			if shorter not in keys:
				keys.add(shorter)
				delete_keys = self._generate_deletes(shorter, dist - 1)
				keys.update(delete_keys)
		return keys

	def search(self, query: str, max_dist: Optional[int] = None):
		if max_dist is None:
			max_dist = self.max_dist	

		candidate_ids = set()

		# Añadir la propia palabra. Aunque esto no va a suceder porque el corrector comprueba previamente con un diccionario si la palabra existe en castellano, sigue siendo recomendable hacerlo
		if query in self.word_to_id:
			candidate_ids.add(self.word_to_id[query])

		# Generar las eliminaciones a cierta distancia y encontrar las listas correspondientes
		query_keys = self._generate_deletes(query, max_dist)
		for key in query_keys:
			candidate_ids.update(self.deletes.get(key, []))

		# Filtrar usando la distancia de edición
		result = []
		for idx in candidate_ids:
			cand = self.word_list[idx]
			if abs(len(cand) - len(query)) <= max_dist:
				dist = damerau_levenshtein(query, cand, max_dist)
				if dist <= max_dist:
					result.append((cand, dist))
					
		return result
	