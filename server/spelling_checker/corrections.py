from candidates import CandidateGenerator
from ngram_model import KNgramModel
from spylls.hunspell import Dictionary
from nltk.tokenize.toktok import ToktokTokenizer
import math
import re

class SpellCorrector:
	_WORD_RE = re.compile(r"\w", re.UNICODE)
	_REPETITIONS_RE = re.compile(r"(.)\1{2,}")
	_SPACE_BEFORE_PUNCT_RE = re.compile(r"\s+([.,;:!?%])")
	_SPACE_AFTER_OPEN_RE = re.compile(r"([¿¡(\[\{])\s+")
	_SPACE_BEFORE_CLOSE_RE = re.compile(r"\s+([)\]\}])")

	def __init__(self, lexicon: Dictionary, candidate_gen: CandidateGenerator, forward_lm: KNgramModel, backward_lm: KNgramModel, max_distance: int = 2):
		self.lexicon = lexicon
		self.candidate_gen = candidate_gen
		self.forward_lm = forward_lm
		self.backward_lm = backward_lm
		self.max_distance = max_distance
		self.tokenizer = ToktokTokenizer()

	def _score_candidates(self, candidates: list[tuple[str, int]], left_context: list[str], right_context: list[str], unigram_weight: float):
		results = []
		total_cont = self.forward_lm.total_cont_sum

		for cand, _ in candidates:
			cand = cand.lower()

			fwd = self.forward_lm.logscore(cand, left_context)
			bwd = self.backward_lm.logscore(cand, right_context)

			cont = self.forward_lm.cont_count.get(cand, 0)
			unigram_log = math.log10(cont / total_cont) if cont > 0 else math.log10(1e-12)			

			# log10 -> cuanto más baja es la probabilidad, menor es el número [-infinito, 0]
			score = fwd + bwd + unigram_weight * unigram_log

			results.append((cand, score))

		return results

	def correct_sentence(self, sentence: list[str], max_candidates: int = 200, unigram_weight: float = 0.5, enhanced: bool = False) -> list[str]:
		corrected = sentence.copy()

		for i in range(len(sentence)):
			corrected[i] = self.correct_word(sentence, i, max_candidates, unigram_weight, enhanced)

		return corrected
	
	def _collapse_repetitions(self, word: str) -> str:
		"""
		Holaaa    -> Hola
		Buenoooos -> Buenos
		Siiii     -> Si
		"""
		return self._REPETITIONS_RE.sub(r"\1", word)
	
	def _restore_case(self, original: str, corrected: str) -> str:
		if original.isupper():
			return corrected.upper()

		if original[:1].isupper():
			return corrected.capitalize()

		return corrected
	
	def correct_word(self, sentence: list[str], position: int, max_candidates: int = 200, unigram_weight: float = 0.5, enhanced: bool = False) -> str:
		original = sentence[position]

		if enhanced and not self._WORD_RE.search(original):
			return original
		
		lookup_word = original.lower()

		if self.lexicon.lookup(lookup_word):
			return self._restore_case(original, lookup_word) if enhanced else original
		
		if enhanced:
			collapsed = self._collapse_repetitions(lookup_word)

			if collapsed != lookup_word and self.lexicon.lookup(collapsed):
				return self._restore_case(original, collapsed)
			
			lookup_word = collapsed
		
		candidates = self.candidate_gen.search(
			lookup_word,
			self.max_distance
		)

		if not candidates:
			return original
		
		candidates.sort(key=lambda x: x[1])
		candidates = candidates[:max_candidates]

		fwd_n = self.forward_lm.order
		left_context = sentence[max(0, position - (fwd_n - 1)):position]
		missing_left = (fwd_n - 1) - len(left_context)

		left_context = [self.forward_lm.bos_token] * missing_left + [w.lower() for w in left_context]

		bwd_n = self.backward_lm.order
		right_context = sentence[position + 1:position + bwd_n]
		right_context = [w.lower() for w in reversed(right_context)]

		missing_right = (bwd_n - 1) - len(right_context)
		right_context = [self.backward_lm.bos_token] * missing_right + right_context

		scored = self._score_candidates(
			candidates=candidates,
			left_context=left_context,
			right_context=right_context,
			unigram_weight=unigram_weight,
		)

		best_word = max(scored, key=lambda x: x[1])[0]

		if enhanced:
			return self._restore_case(original, best_word)

		return best_word
	
	def _toktok_detokenize(self, tokens: list[str]):
		text = " ".join(tokens)

		text = self._SPACE_BEFORE_PUNCT_RE.sub(r"\1", text)
		text = self._SPACE_AFTER_OPEN_RE.sub(r"\1", text)
		text = self._SPACE_BEFORE_CLOSE_RE.sub(r"\1", text)

		return text
	
	def correct_text(self, text: str, max_candidates: int = 200, unigram_weight: float = 0.5) -> str:
		tokens = self.tokenizer.tokenize(text)
		if isinstance(tokens, str):
			tokens = [tokens]
		corrected = self.correct_sentence(tokens, max_candidates, unigram_weight enhanced=True)
		return self._toktok_detokenize(corrected)
