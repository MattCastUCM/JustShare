from services.multilingual_manager import MultilingualManager
from services.model_registry import ModelRegistry
from schemas.similarity import SearchMethod
from pyi18next.i18next import I18next
from typing import Iterable
import re
import os
import json

def traverse_namespaces(base_dir: str, languages: Iterable[str]):
	namespaces = set()

	for lng in languages:
		lng_path = os.path.join(base_dir, lng)

		if os.path.isdir(lng_path):
			for root, _, files in os.walk(lng_path):
				for file in files:
					if file.endswith(".json"):
						full_path = os.path.join(root, file)
						
						rel_path = os.path.relpath(full_path, lng_path)

						namespace = os.path.splitext(rel_path)[0]
						namespace = namespace.replace(os.sep, "/")

						namespaces.add(namespace)

	return list(namespaces)

class LocalizationGraphProcessor:
	pattern = re.compile(r'<([^>]+)>')

	def __init__(self, i18n: I18next, languages: set[str], base_dir: str):
		self.i18n = i18n
		self.languages = languages
		self.base_dir = base_dir

		self.visited = set()
	
	def expand_variants(self, text: str):
		matches = self.pattern.findall(text)
		if not matches:
			return [text]

		sentences = [text]

		for match in matches:
			variants = [v.strip() for v in match.split(',')][1:]
			new_sentences = []

			for sentence in sentences:
				for var in variants:
					# Remplaza la primera ocurrencia
					new_sentence = self.pattern.sub(var, sentence, count=1)
					new_sentences.append(new_sentence)

			sentences = new_sentences

		return sentences

	def process_data(self, data):
		if isinstance(data, str):
			data = data.encode("cp1252").decode("utf-8")
			return self.expand_variants(data)

		elif isinstance(data, list):
			results = []
			for obj in data:
				expanded = self.process_data(obj)
				expanded = expanded if isinstance(expanded, list) else [expanded]
				results.extend(expanded)
			return results

		elif isinstance(data, dict):
			return {k: self.process_data(v) for k, v in data.items()}

		return data
	
	def build_full_id(self, language: str, filename: str, object_names: list[str], node_id: str):
		return "_".join([language, filename] + object_names + [node_id])

	def build_node_key(self, filename: str, object_names: list[str], node_id: str):
		return "_".join([filename] + object_names + [node_id])

	def build_localization_id(self, object_names: list[str], node_id: str):
		return ".".join(object_names + [node_id])
	
	def process_similarity(self, responses: list[dict], node_key: str, language: str):
		raise NotImplementedError
	
	def extract_next_nodes(self, node: dict, loc_id: str, language: str, node_key: str, namespace: str):
		next_nodes = []
		node_type = node.get("type")

		if "next" in node:
			next_nodes.append(node["next"])

		elif node_type == "choice" and "choices" in node:
			for choice in node["choices"]:
				if "next" in choice:
					next_nodes.append(choice["next"])

		elif node_type == "similarity":
			if "choices" in node:
				key = f"{loc_id}.responses"

				responses = self.i18n.t(
					key,
					ns=namespace,
					return_objects=True,
					lng=language,
					name="[UNK]"
				)

				self.process_similarity(
					responses,
					node_key,
					language
				)
				
				for choice in node["choices"]:
					if "next" in choice:
						next_nodes.append(choice["next"])

			if "default" in node and "next" in node["default"]:
				next_nodes.append(node["default"]["next"])

		elif node_type == "condition" and "conditions" in node:
			for cond in node["conditions"]:
				if "next" in cond:
					next_nodes.append(cond["next"])

		return next_nodes
	
	def dfs_traverse(self, language: str, filename: str, rel_path: str, object_names: list[str], node_id: str, node_map: dict):
		full_id = self.build_full_id(language, filename, object_names, node_id)

		if full_id in self.visited:
			return

		self.visited.add(full_id)

		node = node_map.get(node_id)
		if node:
			loc_id = self.build_localization_id(object_names, node_id)
			node_key = self.build_node_key(filename, object_names, node_id)
			
			next_nodes = self.extract_next_nodes(node, loc_id, language, node_key, rel_path)
			
			for next_node in next_nodes:
				self.dfs_traverse(language, filename, rel_path, object_names, next_node, node_map)

	def traverse_graph(self, language: str, filename: str, rel_path: str, object_names: list[str], node_map: dict):
		if "root" in node_map:
			self.dfs_traverse(language, filename, rel_path, object_names, "root", node_map)
		else:
			for sub_name, sub_map in node_map.items():
				self.traverse_graph(language, filename, rel_path, object_names + [sub_name], sub_map)

	def strip_base_and_ext(self, full_path: str, base_dir: str):
		full_path = os.path.normpath(full_path)
		base_dir = os.path.normpath(base_dir)

		rel_path = os.path.relpath(full_path, base_dir)
		rel_path = os.path.splitext(rel_path)[0]

		return rel_path.replace(os.sep, "/")
	
	def run(self):
		for root, _, files in os.walk(self.base_dir):
			for file in files:
				if file.endswith(".json"):
					full_path = os.path.join(root, file)
					
					filename = os.path.splitext(os.path.basename(full_path))[0]
					rel_path = self.strip_base_and_ext(full_path, self.base_dir)

					with open(full_path, "r", encoding="utf-8") as f:
						data = json.load(f)

					for language in self.languages:
						if isinstance(data, dict) and "root" in data:
							self.traverse_graph(language, filename, rel_path, [], data)

						elif isinstance(data, dict):
							for object_name, node_map in data.items():
								self.traverse_graph(language, filename, rel_path, [object_name], node_map)

		print(f"Total visited nodes: {len(self.visited)}")

class LocalizationGraphBuilder(LocalizationGraphProcessor):
	pattern = re.compile(r'<([^>]+)>')

	def __init__(self, i18n: I18next, languages: set[str], base_dir: str, multilingual: MultilingualManager, model_registry: ModelRegistry, model_types: list[SearchMethod]):
		super().__init__(i18n, languages, base_dir)
		self.multilingual = multilingual
		self.model_registry = model_registry
		self.model_types = model_types
	
	def process_similarity(self, responses: list[dict], node_key: str, language: str):
		corpus = []
		metadata = []

		idx = 0
		for group_idx, group in enumerate(responses):
			for sentence_idx, text in enumerate(group["text"]):
				processed_texts = self.process_data(text)

				corpus.extend(processed_texts)

				for processed_text in processed_texts:
					metadata.append({
						"index": idx,
						"text": processed_text,
						"group_index": group_idx,
						"sentence_index": sentence_idx,
						"node": node_key,
					})

				idx += 1

		# Construir bases vectoriales
		for model in self.model_types:
			node_engine = self.multilingual.get_node_engine(language, model)
			retriever = node_engine.build_node(node_key, corpus)
			retriever.add_metadata(metadata)
	
	def run(self):
		super().run()

		for engine in self.multilingual.iter_node_engines():
			engine.save_all()
