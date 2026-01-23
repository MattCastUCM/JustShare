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

def euclidean_distance(vector: np.ndarray):
    return np.linalg.norm(vector, ord=2)

def manhattan_distance(vector: np.ndarray):
    return np.linalg.norm(vector, ord=1)

def euclidean_normalization(vector: np.ndarray):
    return vector / euclidean_distance(vector)