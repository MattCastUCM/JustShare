from math_utils import get_intersection, get_union, euclidean_distance, manhattan_distance
import numpy as np
import numpy.typing as npt

# --- Token-based similarities ---

def jaccard_similarity(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    union = get_union(tokens1, tokens1)

    return len(intersection) / len(union)

def dice_coefficient(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)

    return 2 * len(intersection) / (len(tokens1) + len(tokens2))

def overlap_coefficient(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    min_len = min(len(tokens1), len(tokens2))

    return len(intersection) / min_len

# --- Vector-based similarities ---

def cosise_similarity(vector1: list[float], vector2: list[float]):
    array1 = np.array(vector1)
    array2 = np.array(vector2)
    if array1.shape != array2.shape:
        raise ValueError("Vectors must have the same length.")
    dot = np.dot(vector1, array2)
    distance = euclidean_distance(array1 - array2)
    return dot / distance

def euclidean_similarity(vector1: list[float], vector2: list[float]):
    array1 = np.array(vector1)
    array2 = np.array(vector2)
    if array1.shape != array2.shape:
        raise ValueError("Vectors must have the same length.")
    distance = euclidean_distance(array1 - array2)
    return 1 / (1 + distance)

def manhattan_similarity(vector1: list[float], vector2: list[float]):
    array1 = np.array(vector1)
    array2 = np.array(vector2)
    if array1.shape != array2.shape:
        raise ValueError("Vectors must have the same length.")
    distance = manhattan_distance(array1 - array2)
    return 1 / (1 + distance)