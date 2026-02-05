
from app.models.preprocessing import TextPreprocessor
from app.models.tfidf_vectorizer import TfIdfVectorizer
from app.utils.similarity import jaccard_similarity, cosine_similarity
from app.schemas.similarity import SimilarityResponse
from functools import lru_cache
from gensim.models import KeyedVectors
from app.models.weighted_word2vec import POSWeightedWord2Vec
from langchain_ollama import OllamaEmbeddings
import numpy as np
from spacy.language import Language

class SimilarityEngine:
    def __init__(self, word2vec_models: dict[str, KeyedVectors], embedding_model: OllamaEmbeddings, spacy_models: dict[str, Language], max_n: int):
        self.word2vec_models = word2vec_models
        self.max_n = max_n
        self.embedding_model = embedding_model
        self.spacy_models = spacy_models

    @lru_cache(maxsize=8)
    def get_preprocessor(self, language: str):
        return TextPreprocessor(language, self.spacy_models)

    def preprocess(self, text: str, language: str):
        pre = self.get_preprocessor(language)
        tokens = pre.pipeline_tokenize(
            text,
            steps=[
                pre.clean_text,
                pre.autocorrect,
            ],
        )
        tokens = pre.preprocess(
            tokens,
            steps=[
                pre.remove_stopwords,
                pre.stem,
                lambda tokens: pre.map_tokens(
                    tokens,
                    fields=["stemmed_word"],
                    function=pre.remove_accents,
                )
            ],
        )
        stemmed_tokens = [token.stemmed_word for token in tokens]
        ngrams = pre.add_ngrams(stemmed_tokens, self.max_n)
        return ngrams
        
    def preprocess_batch(self, texts: list[str], language: str):
        return [self.preprocess(text, language) for text in texts]

    def similarity_jaccard(self, corpus: list[str], text: str, language: str) -> SimilarityResponse:
        corpus_tokens = self.preprocess_batch(corpus, language)
        query_tokens = self.preprocess(text, language)
        
        scores = np.array([
            jaccard_similarity(query_tokens, tokens)
            for tokens in corpus_tokens
        ])

        best_idx = scores.argmax()

        return SimilarityResponse(
            index=int(best_idx),
            score=scores[best_idx],
            text=corpus[best_idx]
        )
        
    def similarity_tf_idf(self, corpus: list[str], text: str, language: str):
        model = TfIdfVectorizer(
            tokenizer=lambda texts: self.preprocess_batch(texts, language)
        )
        corpus_vectors = model.fit_transform(corpus)

        query_vector = model.transform([text])

        scores = cosine_similarity(corpus_vectors, query_vector)
        best_idx = scores.argmax()

        return SimilarityResponse(
            index=int(best_idx),
            score=scores[best_idx][0],
            text=corpus[best_idx]
        )
    
    async def similarity_embeddings(self, corpus: list[str], text: str):
        corpus_embeddings = await self.embedding_model.aembed_documents(corpus)
        query_embedding = await self.embedding_model.aembed_query(text)
        
        scores = cosine_similarity(corpus_embeddings, query_embedding)
        best_idx = scores.argmax()

        return SimilarityResponse(
            index=int(best_idx),
            score=scores[best_idx][0],
            text=corpus[best_idx]
        )
    
    def similarity_word2vec(self, corpus: list[str], text: str, language: str):
        wv = self.word2vec_models.get(language)
        if wv:
            model = POSWeightedWord2Vec(wv, language, self.spacy_models)
        
            corpus_vectors = model.fit_transform(corpus)
            query_vector = model.transform([text])

            scores = cosine_similarity(corpus_vectors, query_vector)
            best_idx = scores.argmax()

            return SimilarityResponse(
                index=int(best_idx),
                score=scores[best_idx][0],
                text=corpus[best_idx]
            )
        
        raise ValueError(f"No Word2Vec model found for language '{language}'.")