
from preprocessing import TextPreprocessor
from tfidf_vectorizer import TfIdfVectorizer
import numpy as np
from similarity import jaccard_similarity, cosine_similarity
from models import Corpus, JaccardIndex, TfIdfIndex, EmbeddingIndex, Word2VecIndex
from cachetools import LRUCache
from misc import get_embedding_model
from gensim.models import KeyedVectors
from weighted_word2vec import WeightedWord2Vec
import os

class SimilarityEngine:
    language: str
    max_n: int
    corpora: LRUCache[str, Corpus]

    def __init__(self, language: str = "spanish", max_n: int = 2, cache_size: int = 50):
        self.language = language
        self.max_n = max_n
        self.corpora: LRUCache[str, Corpus] = LRUCache(maxsize=cache_size)

        self.text_preprocessor = TextPreprocessor(language)
        self.embedding_model = get_embedding_model("qwen3-embedding:4b")

        wv_path = os.getenv("SPANISH_WORD2VEC")
        self.wv = KeyedVectors.load(wv_path, mmap="r")
        
    def preprocess_batch(self, texts: list[str]) -> list[list[str]]:
        return [self.text_preprocessor.preprocess(text, max_n=self.max_n) for text in texts]

    def create_corpus(self, id: str, texts: list[str]):
        self.corpora[id] = Corpus(
            id=id,
            texts=texts
        )

    def similarity_jaccard(self, corpus_id: str, text: str):
        corpus = self.corpora.get(corpus_id)
        if corpus is None:
            raise ValueError("Corpus not found.")
        
        if corpus.jaccard is None:
            tokens = self.preprocess_batch(corpus.texts)
            corpus.jaccard = JaccardIndex(
                tokens=tokens
            )

        tokens = self.text_preprocessor.preprocess(
            text,
            max_n = self.max_n
        )

        scores = np.array([jaccard_similarity(tokens, doc_tokens) for doc_tokens in corpus.jaccard.tokens])
        best_idx = scores.argmax()
        return {
            "best_idx": best_idx,
            "best_score": scores[best_idx],
            "best_text": corpus.texts[best_idx]
        }
    
    def similarity_tf_idf(self, corpus_id: str, text: str):
        corpus = self.corpora.get(corpus_id)
        if corpus is None:
            raise ValueError("Corpus not found.")
        
        if corpus.tfidf is None:
            model = TfIdfVectorizer(
                tokenizer=self.preprocess_batch
            )
            vectors = model.fit_transform(corpus.texts)
            corpus.tfidf = TfIdfIndex(
                model=model,
                vectors=vectors
            )

        vector = corpus.tfidf.model.transform([text])
        scores = cosine_similarity(corpus.tfidf.vectors, vector)

        best_idx = scores.argmax()
        return {
            "best_idx": best_idx,
            "best_score": scores[best_idx],
            "best_text": corpus.texts[best_idx]
        }
    
    async def similarity_embeddings(self, corpus_id: str, text: str):
        corpus = self.corpora.get(corpus_id)
        if corpus is None:
            raise ValueError("Corpus not found.")
        
        if corpus.embeddings is None:
            embeddings = await self.embedding_model.aembed_documents(corpus.texts)
            corpus.embeddings = EmbeddingIndex(
                model_name = self.embedding_model.model,
                vectors = embeddings
            )

        vector = await self.embedding_model.aembed_query(text)
        scores = cosine_similarity(corpus.embeddings.vectors, vector)

        best_idx = scores.argmax()
        return {
            "best_idx": best_idx,
            "best_score": scores[best_idx],
            "best_text": corpus.texts[best_idx]
        }
    
    def similarity_word2vec(self, corpus_id: str, text: str):
        corpus = self.corpora.get(corpus_id)
        if corpus is None:
            raise ValueError("Corpus not found.")
        
        if corpus.word2vec is None:
            model = WeightedWord2Vec(self.wv, self.language)
            vectors = model.fit_transform(corpus.texts)
            corpus.word2vec = Word2VecIndex(
                model = model,
                vectors = vectors
            )

        vector = corpus.word2vec.model.transform([text])
        scores = cosine_similarity(corpus.word2vec.vectors, vector)

        best_idx = scores.argmax()
        return {
            "best_idx": best_idx,
            "best_score": scores[best_idx],
            "best_text": corpus.texts[best_idx]
        }