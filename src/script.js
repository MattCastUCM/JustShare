export let isTouch = false

// Pone el focus en el canvas del juego al cargar la pagina
window.onload = function () {
    let focused = document.querySelector("#game-container");
    focused.focus();
};

// Comprobar si el input es tactil o con teclado y raton
window.addEventListener('touchstart', function () {
    isTouch = true;
});
window.addEventListener('mousedown', function () {
    isTouch = false;
});