import StartGame from "./game/main";
import { initInputDetection } from "./inputDetection"
import axios, { AxiosRequestConfig } from 'axios';

async function checkSimilarity() {
    let promise = new Promise(resolve => setTimeout(resolve, 3000));
    await promise;

    return {
        "index": 6,
        "score": 0.42857142857142855,
        "text": "Encantado de conocerte también."
    };
}

document.addEventListener("DOMContentLoaded", async () => {
    checkSimilarity()
        .then(console.log)

    // const gameContainer = "game"
    // initInputDetection(`#${gameContainer}`);
    // StartGame(gameContainer);
    // const corpus = [
    //     "¡Gracias! Si necesito algo, te aviso.",
    //     "Igualmente, un gusto conocerte *sonríes*.",
    //     "Ah, sí... ¡hola!",
    //     "Gracias, cualquier cosa te cuento.",
    //     "Perfecto, muchas gracias.",
    //     "Igualmente, encantado de conocerte.",
    //     "Encantado de conocerte también.",
    //     "El gusto es mío.",
    //     "Jaja, ¡hola!",
    //     "Ah, sí... hola.",
    //     "Perdón, me colgué un poco... hola.",
    //     "Hola, ¿qué tal?",
    //     "Hey, hola.",
    //     "Ah, cierto... hola.",
    //     "Todo bien, gracias.",
    //     "Mucho gusto.",
    //     "Encantado, un placer conocerte.",
    //     "Hola, hola.",
    //     "Ups... ¡hola!",
    //     "Ah, sí, perdón... hola."
    // ]
    // const text = "hola, amiga, encantado de conocerte"
    // const method = "jaccard"
    // const language = "spanish"
    // const body = {
    //     corpus: corpus,
    //     text: text,
    //     method: method,
    //     language: language
    // }
    // const request: AxiosRequestConfig = {
    //     baseURL: import.meta.env.VITE_ML_BASE_URL,
    //     url: "/inference/similarity",
    //     method: "post",
    //     headers: {
    //         "Content-Type": "application/json"
    //     },
    //     data: body
    // }
    // try {
    //     const response = await axios(request)
    //     console.log(response)
    // }
    // catch (error) {
    //     console.error(error);
    // }
});