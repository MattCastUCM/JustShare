import StartGame from "./game/main";
import { initInputDetection } from "./inputDetection"
import SentenceMatching from "./textSimilarity/sentenceMatching";
import { getEmbeddingModel } from "./textSimilarity/models";

document.addEventListener("DOMContentLoaded", async () => {
    const model = getEmbeddingModel("qwen3-embedding:4b");
    const corpus = [
        "Igualmente, encantado de conocerte *sonríes*.",
        "Gracias, si necesito algo ya te iré diciendo.",
        "... Ah, sí, hola."
    ]
    const sentenceMatching = await SentenceMatching.create(corpus, "tfidf", model);
    const { match, score } = await sentenceMatching.match("hola, estoy bien, yo también estoy encantado de conocerte")
    console.log(match, score)
    // const gameContainer = "game"
    // initInputDetection(`#${gameContainer}`);
    // StartGame(gameContainer);
});