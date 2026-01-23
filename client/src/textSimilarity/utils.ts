// export function dotProduct(vector1: number[], vector2: number[]) {
//     if (vector1.length !== vector2.length) {
//         throw new Error("Vectors must have same length.");
//     }
//     let product = 0;
//     for (let i = 0; i < vector1.length; ++i) {
//         product += vector1[i] * vector2[i];
//     }
//     return product;
// }

// export function magnitude(vector: number[]) {
//     // let sum = 0;
//     // for (const v of vector) {
//     //     sum += v * v
//     // }
//     // return Math.sqrt(sum);
//     // const sumWithInitial = array.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
//     return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
// }

// export function l2Normalize(vector: number[]) {
//     const norm = magnitude(vector);
//     // Vector zero
//     if (norm <= 0) {
//         return vector;
//     }
//     return vector.map(v => v / norm);
// }

// export function getUnion<T>(tokens1: T[], tokens2: T[]) {
//     const set1 = new Set(tokens1);
//     const set2 = new Set(tokens2);

//     return new Set([...set1, ...set2]);
// }

// export function getIntersection<T>(tokens1: T[], tokens2: T[]) {
//     const set1 = new Set(tokens1);
//     const set2 = new Set(tokens2);

//     return new Set([...set1].filter(x => set2.has(x)));
// }