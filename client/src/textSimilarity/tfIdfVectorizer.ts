import { l2Normalize } from "./utils";

export default class TfIdfVectorizer {
    private vocab: Map<string, number>
    private idf: Map<string, number>
    private corpusVectors: number[][]

    public constructor(corpus: string[][]) {
        const df = this.calculateDocumentFrequency(corpus);
        this.idf = this.calculateInverseDocumentFrequency(df, corpus);

        const terms = Array.from(df.keys()).sort();
        this.vocab = new Map();
        terms.forEach((term, i) => this.vocab.set(term, i));

        this.corpusVectors = corpus.map(doc => this.vectorize(doc));
    }

    private calculateTermFrequency(doc: string[]) {
        const tf: Map<string, number> = new Map();

        const length = doc.length;
        if (length <= 0) {
            return tf;
        }

        for (const term of doc) {
            tf.set(term, (tf.get(term) ?? 0) + 1);
        }

        for (const [term, count] of tf) {
            tf.set(term, count / length);
        }

        return tf;
    }

    private calculateDocumentFrequency(docs: string[][]) {
        const df: Map<string, number> = new Map();

        for (const doc of docs) {
            const uniqueTerms = new Set(doc);
            for (const term of uniqueTerms) {
                df.set(term, (df.get(term) ?? 0) + 1);
            }
        }
        return df;
    }

    private calculateInverseDocumentFrequency(df: Map<string, number>, docs: string[][]) {
        const nDocs = docs.length;

        const idf: Map<string, number> = new Map;
        for (const [term, freq] of df) {
            idf.set(term, Math.log((nDocs + 1) / (freq + 1)) + 1);
        }
        return idf;
    }

    public vectorize(tokens: string[]) {
        const vector = new Array(this.vocab.size).fill(0);

        const tf = this.calculateTermFrequency(tokens);

        for (const [term, tfVal] of tf) {
            const idx = this.vocab.get(term);
            if (idx !== undefined) {
                vector[idx] = tfVal * (this.idf.get(term) ?? 0);
            }
        }
        return l2Normalize(vector);
    }

    public getCorpusVectors() {
        return this.corpusVectors;
    }
}