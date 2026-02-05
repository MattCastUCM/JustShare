from typing import TypeVar
import numpy as np

T = TypeVar("T")

def get_union(list1: list[T], list2: list[T]):
    union_set = set()
    union_list = []
    combined = list1 + list2
    for item in combined:
        if item not in union_set:
            union_set.add(item)
            union_list.append(item)
    return union_list

def get_intersection(list1: list[T], list2: list[T]):
    set2 = set(list2)
    return [item for item in list1 if item in set2]

def euclidean_normalization(vectors: np.ndarray):
    vectors = np.atleast_2d(np.asarray(vectors))
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms <= 0] = 1
    return vectors / norms