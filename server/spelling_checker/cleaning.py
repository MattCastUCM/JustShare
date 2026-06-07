from collections import Counter
from loader import load_include_exclude, load_file, read_dictionary
from tqdm import tqdm
from collections import Counter
from nltk.tag import pos_tag
from nltk.tokenize.toktok import ToktokTokenizer
from typing import Optional
import unicodedata
import re
import string

def clean_spanish(word_frequency: Counter[str], filepath_exclude: str, filepath_include: str, filepath_dictionary: str, min_frequency: int):
	"""Clean a Spanish word frequency list

	Args:
		word_frequency (Counter):
		filepath_exclude (str):
		filepath_include (str):
	"""
	letters = set("abcdefghijklmnopqrstuvwxyzáéíóúüñ")

	# fix issues with words containing other characters
	invalid_chars = list()
	for key in word_frequency:
		kl = set(key)
		if not kl.issubset(letters):
			invalid_chars.append(key)
	for misfit in invalid_chars:
		word_frequency.pop(misfit)

	# fix issues with more than one accent marks
	# NOTE: Not sure there are any occurrences but this is not possible as a valid word!
	duplicate_accents = list()
	for key in word_frequency:
		if (key.count("á") + key.count("é") + key.count("í") + key.count("ó") + key.count("ú")) > 1:
			duplicate_accents.append(key)
	for misfit in duplicate_accents:
		word_frequency.pop(misfit)

	# fix misplaced "ü" marks
	# NOTE: the ü must be just after a g and before an e or i only (with or without accent)!
	misplaced_u = list()
	for key in word_frequency:
		if "ü" not in key:
			continue
		idx = key.index("ü")
		if idx == 0 or idx == len(key) - 1:  # first or last letter
			misplaced_u.append(key)
			continue
		if key[idx - 1] != "g" and key[idx + 1] not in "eéií":
			misplaced_u.append(key)
	for misfit in misplaced_u:
		word_frequency.pop(misfit)

	# ción issues
	cion_issues = list()
	for key in word_frequency:
		if not key.endswith("cion"):
			continue
		base = key[:-4]
		n_key = f"{base}ción"
		if n_key in word_frequency:
			cion_issues.append(key)
	for misfit in cion_issues:
		word_frequency.pop(misfit)

	# remove words that start with a double a ("aa")
	double_a = list()
	for key in word_frequency:
		if key.startswith("aa"):
			double_a.append(key)
	for misfit in double_a:
		word_frequency.pop(misfit)

	# TODO: other possible fixes?

	# remove small numbers
	small_frequency = list()
	for key in word_frequency:
		if word_frequency[key] <= min_frequency:
			small_frequency.append(key)
	for misfit in small_frequency:
		word_frequency.pop(misfit)

	# remove flagged misspellings
	for line in load_include_exclude(filepath_exclude):
		if line in word_frequency:
			word_frequency.pop(line)

	# Use a dictionary to clean up everything else...
	final_words_to_remove = []
	# Construir una lista de palabras válidas en español a partir de un diccionario
	dictionary_words = read_dictionary(filepath_dictionary, letters)

	for word in word_frequency:
		# Eliminar palabras que no se encuentran en el diccionario
		if word not in dictionary_words:
			final_words_to_remove.append(word)
	for word in final_words_to_remove:
		word_frequency.pop(word)

	# Agregar palabras del diccionario
	for word in dictionary_words:
		if word not in word_frequency:
			word_frequency[word] = min_frequency

	# Add known missing words back in (ugh)
	for line in load_include_exclude(filepath_include):
		if line in word_frequency:
			print(f"{line} is already found in the dictionary! Skipping!")
		else:
			word_frequency[line] = min_frequency

	return word_frequency

def build_word_frequency(path: str):
	"""Parse the passed in text file (likely from Open Subtitles) into
	a word frequency list and write it out to disk

	Args:
		filepath (str):
		language (str):
	Returns:
		Counter: The word frequency as parsed from the file
	Note:
		This only removes words that are proper nouns (attempts to...) and
		anything that starts or stops with something that is not in the alphabet.
	"""
	word_frequency = Counter()
	tok = ToktokTokenizer()

	with load_file(path, "utf-8") as f:
		total_lines = sum(1 for _ in f)
		
	with load_file(path, "utf-8") as fobj:
		for line in tqdm(fobj, total=total_lines, desc="Processing lines"):
			# tokenize into parts
			parts = tok.tokenize(line)

			# Attempt to remove proper nouns
			# Remove things that have leading or trailing non-alphabetic characters.
			tagged_sent = pos_tag(parts)
			words = [
				unicodedata.normalize("NFC", word[0].lower())
				for word in tagged_sent
				# - word[0] -> la palabra existe
				# - word[1] != "NNP" -> eliminar nombres propios
				# - word[0][0].isalpha() -> empieza con una letra. Eliminar cosas como "123abc", "!hola"...
				# - word[0][-1].isalpha() -> termina como una letra. Eliminar cosas como "hello!"...
				if word[0] and word[1] != "NNP" and word[0][0].isalpha() and word[0][-1].isalpha()
			]
			
			if words:
				word_frequency.update(words)

	return word_frequency

NOISE_PATTERNS = [
	r"^\s*$",					# vacío
	r"^[-]+$",					# ----
	r"^\.\.\.$",				# ...
	r"^\[.*\]$",				# [music], [applause]
	r"^\(.*\)$",				# (laughs)
	r"^\d+$"					# solo números
]

noise_re = re.compile("|".join(NOISE_PATTERNS), re.IGNORECASE)

def is_cast_or_credit_line(line: str) -> bool:
	# Truco simple para líneas tipo "Freder - Gustav Fröhlich"
	return (
		line.count("-") >= 2
		and len(line.split()) <= 10
	)

def clean_token(token: str, num_token: str) -> str | None:
	# Conservar el marcador numérico tal cual
	if token == num_token:
		return token

	# Eliminar puntuación del inicio y final
	token = token.strip(string.punctuation)

	# Si está vacío, descartar
	if not token:
		return None

	# Si es solo dígitos (después de limpiar), convertir a marcador numérico
	if token.isdigit():
		return num_token

	# Descartar si no contiene ninguna letra
	if not any(c.isalpha() for c in token):
		return None

	return token

def build_sentences(path: str, max_lines: Optional[int] = None, num_token: str = "<num>", min_words: int = 3):
	tok = ToktokTokenizer()
	sentences = []

	total_lines_processed = 0
	discarded_noise = 0
	discarded_cast_credit = 0
	discarded_clean_empty = 0
	discarded_min_words = 0

	with load_file(path, "utf-8") as f:
		total_lines = sum(1 for _ in f)

	if max_lines is not None:
		total_lines = min(total_lines, max_lines)
		
	with load_file(path, "utf-8") as fobj:
		for i, line in tqdm(enumerate(fobj, start=1), total=total_lines, desc="Processing lines"):
			if max_lines is not None and i > max_lines:
				break

			total_lines_processed += 1
			line = unicodedata.normalize("NFC", line.strip())

			if noise_re.match(line):
				discarded_noise += 1
				continue
			
			if is_cast_or_credit_line(line):
				discarded_cast_credit += 1
				continue

			tokens = tok.tokenize(line)
			words = []

			for token in tokens:
				token = unicodedata.normalize("NFC", token.lower().strip())

				cleaned = clean_token(token, num_token)
				if cleaned is None:
					continue

				words.append(cleaned)

			if not words:
				discarded_clean_empty += 1
				continue

			# Evitar frases muy cortas para extraer semántica posteriormente utilizando el modelo n-gramas
			if len(words) < min_words:
				discarded_min_words += 1
				continue
			
			sentences.append(words)

	total_discarded = total_lines_processed - len(sentences)

	print(f"Total líneas procesadas:\t{total_lines_processed:,}")
	print(f"  - Descartadas por ruido:\t{discarded_noise:,}")
	print(f"  - Descartadas por crédito/elenco:\t{discarded_cast_credit:,}")
	print(f"  - Descartadas por tokenización vacía:\t{discarded_clean_empty:,}")
	print(f"  - Descartadas por < {min_words} palabras:\t{discarded_min_words:,}")
	print(f"Total líneas descartadas final:\t{total_discarded:,}")
	print(f"Oraciones finales guardadas:\t{len(sentences):,}")

	return sentences