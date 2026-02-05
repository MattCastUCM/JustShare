from app.utils.math_utils import get_intersection, get_union
import numpy as np
import numpy.typing as npt
from loguru import logger

# --- Token-based similarities ---

def jaccard_similarity(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    logger.debug(f"Intersection: {intersection}")
    union = get_union(tokens1, tokens2)
    logger.debug(f"Union: {union}")

    if not union:
        return 0.0
    
    return len(intersection) / len(union)

def dice_coefficient(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    denom = len(tokens1) + len(tokens2)

    return 2 * len(intersection) / denom

def overlap_coefficient(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    min_len = min(len(tokens1), len(tokens2))

    if min_len <= 0:
        return 0.0

    return len(intersection) / min_len

# --- Vector-based similarities ---

def cosine_similarity(vectors1: npt.ArrayLike, vectors2: npt.ArrayLike) -> np.ndarray:
    vectors1 = np.atleast_2d(np.asarray(vectors1))
    vectors2 = np.atleast_2d(np.asarray(vectors2))

    norm_a = np.linalg.norm(vectors1, axis=1, keepdims=True)
    norm_b = np.linalg.norm(vectors2, axis=1, keepdims=True)
    
    dot = vectors1 @ vectors2.T
    denom = norm_a * norm_b.T
    return dot / (denom + 1e-10)
 
def euclidean_similarity(vector1: list[float], vector2: list[float]):
    array1 = np.array(vector1)
    array2 = np.array(vector2)
    if array1.shape != array2.shape:
        raise ValueError("Vectors must have the same length.")
    distance = np.linalg.norm(array1 - array2)
    return 1 / (1 + distance)

def manhattan_similarity(vector1: list[float], vector2: list[float]):
    array1 = np.array(vector1)
    array2 = np.array(vector2)
    if array1.shape != array2.shape:
        raise ValueError("Vectors must have the same length.")
    distance = np.linalg.norm(array1 - array2, ord=2)
    return 1 / (1 + distance)