import { GameObjects } from "phaser";
import { DEBUG } from "../../types/misc";

/**
* Crear una lista de numeros desde "start" hasta "end" incrementando "step" en cada paso
* @param {number} start - valor inicial de la lista
* @param {number} end - valor final de la lista
* @param {number} step - incremento en cada paso
* @returns {Array, Number} - lista de numeros
*/
export function range(start: number, end: number, step: number) {
    let range: number[] = [];
    for (let i = start; i < end; i += step) {
        range.push(i);
    }
    // Simpre se incluye "end"
    if (range[range.length - 1] !== end) {
        range.push(end);
    }
    return range;
}

export function fontSizeToInt(fontSize: string) {
    return parseInt(fontSize.replace("px", ""));
}

/**
* Configura un objeto para que sea interactivo y le asigna un cursor personalizado si esta disponible
* @param {GameObjects.GameObject} gameObject - objeto que se va a hacer interactivo 
* @param {Phaser.Types.Input.InputConfiguration} prevConfig - configuracion a la que agregar el parametro del cursor 
*/
export function setInteractive(gameObject: GameObjects.GameObject, config: Phaser.Types.Input.InputConfiguration = {}) {
    let scene = gameObject.scene;

    if (scene.registry.get("pointerOver") != null) {
        config.cursor = `url(${scene.registry.get("pointerOver")}), pointer`;
    }
    else {
        config.useHandCursor = true;
    }

    gameObject.setInteractive(config);

    // Guarda la llamada original al disableInteractive del objeto
    let defaultDisableInteractive = gameObject.disableInteractive.bind(gameObject);

    // Cambia la funcionalidad del disableInteractive
    gameObject.disableInteractive = () => {
        // Llama al disableInteractive original forzando el cambio de cursor al por defecto
        defaultDisableInteractive(true);

        // Restaura el disableInteractive por la llamada original
        gameObject.disableInteractive = defaultDisableInteractive;

        return gameObject;
    }

    if (DEBUG) {
        scene.input.enableDebug(gameObject, 0x00ff00);
    }
}