import StartGame from "./game/main";
import { initInputDetection } from "./inputDetection"

document.addEventListener("DOMContentLoaded", () => {
    const gameContainer = "game"
    initInputDetection(`#${gameContainer}`);
    StartGame(gameContainer);
});