import StartGame from "./game/main";
import { initInputDetection } from "./inputDetection"

document.addEventListener("DOMContentLoaded", async () => {
    const gameContainer = "game"
    initInputDetection(`#${gameContainer}`);
    StartGame(gameContainer);
});