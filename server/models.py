from pydantic import BaseModel, ConfigDict
from tfidf_vectorizer import TfIdfVectorizer
from weighted_word2vec import WeightedWord2Vec
from typing import Optional
import numpy as np

class JaccardIndex(BaseModel):
    tokens: list[list[str]]

class TfIdfIndex(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    model: TfIdfVectorizer
    vectors: np.ndarray

class EmbeddingIndex(BaseModel):
    model_name: str
    vectors: list[list[float]]

class Word2VecIndex(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    model: WeightedWord2Vec
    vectors: np.ndarray

class Corpus(BaseModel):    
    id: str
    texts: list[str]

    jaccard: Optional[JaccardIndex] = None
    tfidf: Optional[TfIdfIndex] = None
    embeddings: Optional[EmbeddingIndex] = None
    word2vec: Optional[Word2VecIndex] = None

class CorpusRequest(BaseModel):
    id: str
    texts: list[str]

class SimilarityRequest(BaseModel):
    text: str
