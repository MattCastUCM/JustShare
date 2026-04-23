from controllers.encoders.jaccard import JaccardEncoder
from services.multilingual_manager import MultilingualManager
	
class SimilarityEngine:
	def __init__(self, manager: MultilingualManager):
		self.manager = manager
		
	def search_jaccard(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = self.manager.get_dense_retriever(
			language=language,
			model_type=JaccardEncoder.name,
			similarity_fn=JaccardEncoder.jaccard
		)
		retriever.fit(corpus)

		return retriever.search(query, top_k)
		
	def search_tf_idf(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = self.manager.get_dense_retriever(
			language=language,
			model_type="tfidf"
		)
		retriever.fit(corpus)

		return retriever.search(query, top_k)
	
	def search_sbert(self, query: str, corpus: list[str], top_k: int, language: str):
		retriever = self.manager.get_dense_retriever(
			language=language,
			model_type="sbert"
		)
		retriever.fit(corpus)

		return retriever.search(query, top_k)
