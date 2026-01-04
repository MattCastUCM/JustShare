let isTouch: boolean = false

export const isTouchInput = (): boolean => isTouch;

export function initInputDetection(selector: string) {
    focusGameElement(selector);
    registerInputListeners();
}

function focusGameElement(selector: string) {
    const element = document.querySelector<HTMLElement>(selector);
    element?.focus();
}

function registerInputListeners(): void {
    const setTouch = (): void => { isTouch = true; };
    const setMouse = (): void => { isTouch = false; };

    window.addEventListener("touchstart", setTouch, { passive: true });
    window.addEventListener("mousedown", setMouse);
    window.addEventListener("keydown", setMouse);
}