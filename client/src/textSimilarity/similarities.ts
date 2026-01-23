import { getIntersection, getUnion, dotProduct, magnitude } from "./utils";

export function jaccardSimilarity(tokens1: string[], tokens2: string[]) {
    const intersection = getIntersection(tokens1, tokens2);
    const union = getUnion(tokens1, tokens2);

    return intersection.size / union.size;
}

// Más permisiva que Jaccard (buena para frases cortas)
export function diceCoefficient(tokens1: string[], tokens2: string[]) {
    const intersection = getIntersection(tokens1, tokens2);

    return intersection.size / (tokens1.length + tokens2.length);
}

// Buena para frases muy cortas
export function overlapCoefficient(tokens1: string[], tokens2: string[]) {
    const intersection = getIntersection(tokens1, tokens2);

    const min = Math.min(tokens1.length, tokens2.length);
    return intersection.size / min;
}

// Mide dirección, pero ignora magnitud
export function cosineSimilarity(vector1: number[], vector2: number[]) {
    if (vector1.length !== vector2.length) {
        throw new Error("Vectors must have same length.");
    }
    return dotProduct(vector1, vector2) / (magnitude(vector1) * magnitude(vector2));
}

// Mide distancia real
export function euclideanSimilarity(vector1: number[], vector2: number[]) {
    if (vector1.length !== vector2.length) {
        throw new Error("Vectors must have same length.");
    }

    let sumSquares = 0;
    for (let i = 0; i < vector1.length; ++i) {
        sumSquares += (vector1[i] - vector2[i]) ** 2;
    }
    const distance = Math.sqrt(sumSquares);
    // Convertir distancia a similitud [0,1]
    return 1 / (1 + distance);
}

// Mide distancia real
export function manhattanSimilarity(vector1: number[], vector2: number[]) {
    if (vector1.length !== vector2.length) {
        throw new Error("Vectors must have same length.");
    }

    let distance = 0;
    for (let i = 0; i < vector1.length; ++i) {
        distance += Math.abs(vector1[i] - vector2[i]);
    }
    // Convertir distancia a similitud [0,1]
    return 1 / (1 + distance);
}

export function dotProductSimilarity(vector1: number[], vector2: number[]) {
    if (vector1.length !== vector2.length) {
        throw new Error("Vectors must have same length.");
    }
    // Devolver el producto escalar (magnitud importa).
    // No está normalizada a [0,1]
    return dotProduct(vector1, vector2);
}