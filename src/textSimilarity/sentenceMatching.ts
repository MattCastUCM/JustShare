import stopwordsArray from "stopwords-es";
import stemmer from "stemmer_es";
import TfIdfVectorizer from "./tfIdfVectorizer";
import { jaccardSimilarity, cosineSimilarity } from "./similarities";
import { Embeddings } from "@langchain/core/embeddings";

type SimilarityMethod = "jaccard" | "tfidf" | "embeddings";

export default class SentenceMatching {
    method: SimilarityMethod
    maxN: number
    corpus: string[]
    stopwords: Set<string>
    corpusTokens: string[][]
    tfIdfVectorizer: TfIdfVectorizer
    model: Embeddings
    corpusEmbeddings: number[][];

    private constructor(corpus: string[], method: SimilarityMethod, model: Embeddings, maxN: number = 2) {
        this.corpus = corpus;
        this.method = method;
        this.model = model;
        this.maxN = maxN;

        this.stopwords = new Set(stopwordsArray);
        this.corpusTokens = this.corpus.map(doc => this.preprocessWithNgrams(doc));
        this.tfIdfVectorizer = new TfIdfVectorizer(this.corpusTokens);
    }

    static async create(corpus: string[], method: SimilarityMethod, model: Embeddings, maxN: number = 2) {
        const instance = new SentenceMatching(corpus, method, model, maxN);

        if (method === "embeddings") {
            instance.corpusEmbeddings = await model.embedDocuments(corpus);
            // instance.corpusEmbeddings.map(v => console.log(v.slice(0, 100)));
        }

        return instance;
    }

    private ngrams(tokens: string[], n: number) {
        const result = [];
        for (let i = 0; i <= tokens.length - n; i++) {
            result.push(tokens.slice(i, i + n).join('_'));
        }
        return result;
    }

    private preprocessWithNgrams(text: string) {
        const tokens = this.preprocess(text);
        const allTokens = [...tokens];
        for (let n = 2; n <= this.maxN; n++) {
            allTokens.push(...this.ngrams(tokens, n));
        }
        return allTokens;
    }

    private preprocess(text: string) {
        text = text.toLowerCase();
        text = text.replace(/[^a-záéíóúüñ\s]/g, '');

        let tokens = text.split(/\s+/);

        const lemmas = [];
        for (let token of tokens) {
            if (token && !this.stopwords.has(token)) {
                token = token.normalize('NFD')
                token = token.replace(/[\u0300-\u036f]/g, '');
                if (token) {
                    token = stemmer.stem(token)
                    lemmas.push(token);
                }
            }
        }
        return lemmas;
    }

    public async match(userSentence: string) {
        const userTokens = this.preprocessWithNgrams(userSentence);
        console.log(userTokens);

        const userVector = this.tfIdfVectorizer.vectorize(userTokens);
        const corpusVectors = this.tfIdfVectorizer.getCorpusVectors();

        let userEmbeddings: number[] = [];
        if (this.method == "embeddings") {
            userEmbeddings = await this.model.embedQuery(userSentence);
        }

        let bestScore = 0;
        let bestMatch = "";

        this.corpus.forEach((text, i) => {
            let score = 0;
            // 0.3
            if (this.method == "jaccard") {
                const tokens = this.corpusTokens[i];
                score = jaccardSimilarity(userTokens, tokens);
            }
            // 0.5
            else if (this.method == "tfidf") {
                const vector = corpusVectors[i];
                score = cosineSimilarity(userVector, vector);
            }
            // 0.7
            else if (this.method == "embeddings") {
                const embeddings = this.corpusEmbeddings[i];
                score = cosineSimilarity(userEmbeddings, embeddings);
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = text;
            }
        });

        return { match: bestMatch, score: bestScore };
    }
}