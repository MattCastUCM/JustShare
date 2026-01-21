import { OllamaEmbeddings } from "@langchain/ollama";
import { Embeddings } from "@langchain/core/embeddings";

export function getEmbeddingModel(model: string, temperature: number = 0.8): Embeddings {
    const embeddings = new OllamaEmbeddings({
        model: model,
        baseUrl: import.meta.env.OLLAMA_HOST,
        requestOptions: {
            numGpu: -1,
            temperature: temperature
        }
    });
    return embeddings;
}