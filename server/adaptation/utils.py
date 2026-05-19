
import re
import os
from typing import Iterable

def apply_name_patterns(text: str, replacement: str) -> str:
	out = str(text)

	out = re.sub(r"\s+", " ", out).strip()

	def repl(m):
		intro = m.group(0)
		name = m.group(1)
		return intro.replace(name, replacement)

	patterns = [
		r"\bsoy\s+(mi nombre|me llamo|\.\.\.|[^\s,;:.…!?]+)",
		r"\bme llamo\s+([^\s,;:.…!?]+)",
	]

	for pat in patterns:
		out = re.sub(pat, repl, out, flags=re.IGNORECASE)

	return out

def anonymize_names(text: str, replacement: str = "{{name}}", name_replacements: set[str] = set()) -> str:
	out = apply_name_patterns(text, replacement)

	# Agregar el nombre después de "soy" si no existe
	out = re.sub(
		rf"\bsoy\b(?!\s*{re.escape(replacement)})",
		f"soy {replacement}",
		out,
		flags=re.IGNORECASE
	)

	# Reemplazar nombres que no se han detectado con las expresiones regulares
	for name in name_replacements:
		out = re.sub(rf"\b{name}\b", lambda m: replacement, out)
		
	out = re.sub(r"\s+([,;:.!?])", r"\1", out)

	return out

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
