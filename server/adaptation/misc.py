
import re

class NameAnonymizer:
	def __init__(self, names_path: str, whitelist_path: str, replacement: str):
		self.replacement = replacement

		self.names = self._load_file(names_path)
		self.whitelist = self._load_file(whitelist_path)

		self.target_names = self.names.difference(self.whitelist)

		self.space_re = re.compile(r"\s+")
		self.soy_guard_re = re.compile(
			rf"\bsoy\b(?!\s*{re.escape(self.replacement)})",
			re.IGNORECASE
		)

		self.patterns = [
			re.compile(
				r"\bsoy\s+(mi nombre|me llamo|\.\.\.|[^\s,;:.…!?]+)",
				re.IGNORECASE
			),
			re.compile(
				r"\bme llamo\s+([^\s,;:.…!?]+)",
				re.IGNORECASE
			),
		]

		self.name_re = self._build_big_regex(self.target_names)

	def _build_big_regex(self, names: set[str]) -> re.Pattern:
		"""
		Construye un único regex:
		\b(name1|name2|name3)\b
		"""

		# Por si acaso, escapar caracteres especiales
		escaped = (re.escape(n) for n in names)

		# Unir todos los nombres en un solo patrón
		pattern = r"\b(" + "|".join(escaped) + r")\b"

		return re.compile(pattern, re.IGNORECASE)

	def _load_file(self, path: str) -> set[str]:
		names = set()

		with open(path, "r", encoding="utf-8") as f:
			for line in f:
				line = line.strip()

				if not line or line.startswith("#"):
					continue

				names.add(line)

		return names

	def apply_name_patterns(self, text: str) -> str:
		out = self.space_re.sub(" ", str(text)).strip()

		def repl(m):
			intro = m.group(0)
			name = m.group(1)
			return intro.replace(name, self.replacement)

		for pat in self.patterns:
			out = pat.sub(repl, out)

		# Reemplazar nombre explícitos
		out = self.name_re.sub(self.replacement, out)

		return out

	def anonymize_names(self, text: str) -> str:
		out = self.apply_name_patterns(text)

		# Agregar el nombre después de "soy" si no existe
		out = self.soy_guard_re.sub(
            f"soy {self.replacement}",
            out
        )

		return out
