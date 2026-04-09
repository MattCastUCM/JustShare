from typing import TypeVar

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

def jaccard_similarity(tokens1: list[str], tokens2: list[str]):
    intersection = get_intersection(tokens1, tokens2)
    union = get_union(tokens1, tokens2)
    
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