from collections import Counter
import contextlib
from typing import Optional
import gzip
import json
from typing import Iterable

@contextlib.contextmanager
def load_file(path: str, encoding: str = "utf-8"):
	if path.endswith(".gz"):
		with gzip.open(path, mode="rt", encoding=encoding) as fobj:
			yield fobj
	else:
		with open(path, encoding=encoding) as fobj:
			yield fobj

def load_include_exclude(path: str, encoding: str = "utf-8"):
	with load_file(path=path, encoding=encoding) as f:
		for line in f:
			if not line[0] == "#":
				line = line.strip().split()
				for ln in line:
					yield ln.strip().lower()

def read_sentences(path: str, encoding: str = "utf-8") -> list[list[str]]:
	with load_file(path=path, encoding=encoding) as f:
		return [
			line.strip().split()
			for line in f
			if line.strip()
		]
	
def read_dictionary(path: str, letters: Optional[set[str]] = None, encoding: str = "utf-8") -> set[str]:
	dictionary_words = set()
	with load_file(path, encoding) as fobj:
		for line in fobj:
			word = line.lower().strip()

			if word:
				if letters is None or word[0] in letters:
					dictionary_words.add(word)

	return dictionary_words

def export_word_frequency(path: str, word_frequency: Counter[str]):
	with open(path, "w", encoding="utf-8") as f:
		json.dump(word_frequency, f, indent=4, sort_keys=True, ensure_ascii=False)

def export_misfit_words(misfit_path: str, word_freq_path: str, word_frequency: Counter[str]):
	with load_file(word_freq_path, "utf-8") as f:
		source_word_frequency = json.load(f)

	source_words = set(source_word_frequency.keys())
	final_words = set(word_frequency.keys())

	misfitted_words = source_words.difference(final_words)
	misfitted_words = sorted(list(misfitted_words))

	export_lines(misfit_path, misfitted_words)

def export_sentences(filepath: str, sentences: list[list[str]]):
	with open(filepath, "w", encoding="utf-8") as f:
		for sent in sentences:
			f.write(" ".join(sent) + "\n")

def export_dictionary(filepath: str, dictionary: set[str]):
    export_lines(filepath, sorted(dictionary))

def export_lines(path: str, lines: Iterable[str]):
    with open(path, "w", encoding="utf-8") as f:
        for line in lines:
            f.write(line + "\n")
			