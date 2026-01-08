import { Scene, GameObjects } from "phaser";

export function componentToHex(component: number) {
    // Se convierte en un numero de base 16, en string
    const hex = component.toString(16);
    // Si el numero es menor que 16, solo tiene un digito, por lo que hay que anadir un 0 delante
    return hex.length == 1 ? "0" + hex : hex;
}

export function rgbToHex(R: number, G: number, B: number) {
    return "#" + componentToHex(R) + componentToHex(G) + componentToHex(B);
}

type RGB = {
    R: number;
    G: number;
    B: number;
};

export function hexToRgb(hex: string): RGB | null {
    // ^ ---> tiene que comenzar por #
    // a-f\d --> caracteres entre a-f y entre 0-9 (\d)
    // {2} --> grupo de dos caracteres que cumplan la condicion de arriba
    // $ --> final de la cadena. De modo que por ejemplo, "Some text #ffffff some more" no valdria
    // i --> se permiten letras en minuscula y en mayuscula
    const regex = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
    const result = regex.exec(hex);

    if (result) {
        const rgb : RGB = {
            R: parseInt(result[1], 16),
            G: parseInt(result[2], 16),
            B: parseInt(result[3], 16)
        }
        return rgb;
    }
    return null;
}

interface BoxFill {
    name: string;
    color: number;
}

interface BoxEdge {
    name: string;
    color: number;
    width: number;
}

interface BoxParams {
    fill: BoxFill;
    edge: BoxEdge;
    width: number;
    height: number;
    arc: number;
    offset: number;
}

/**
 * Sirve para crear una forma primitva usando el objeto grafico creado anteriormente
 * Se van a crear tanto la parte interior como el borde de la forma
 * IMPORTANTE:
 * - La forma primitva no se puede crear pegada a uno de los bordes de la pantalla porque sino hay ciertos detalles que se pierden
 * - La textura generada a partir de la forma primitiva no puede ser exactamente del mismo detalle que la forma porque sino hay
 *      ciertos detalles que se pierden.
 * Por los motivos nombrados arriba se utiliza un pequeño offset. Sin embargo, esto va a provocar que la caja de colision
 * textura sea un poquito mas grande que la textura en si
 * Nota: a la hora de crear una forma primitiva con un objeto grafico, el (0, 0) esta arriba a la izquierda
 */
function generateBox(graphics: GameObjects.Graphics, params: BoxParams) {
    // Parte interior
    graphics.fillStyle(params.fill.color, 1);
    graphics.fillRoundedRect(params.offset, params.offset, params.width, params.height, params.arc);
    graphics.generateTexture(params.fill.name, params.width + params.offset * 2, params.height + params.offset * 2);
    graphics.clear();

    // Borde
    graphics.lineStyle(params.edge.width, params.edge.color, 1);
    graphics.strokeRoundedRect(params.offset, params.offset, params.width, params.height, params.arc);
    graphics.generateTexture(params.edge.name, params.width + params.offset * 2, params.height + params.offset * 2);
    graphics.clear();
}

const OFFSET = 10

// Se crea un rectangulo con bordes redondeados que sirve para una caja de texto
export const textBox : BoxParams = {
    fill: {
        name: "fillTextBox",
        color: 0xffffff
    },
    edge: {
        name: "edgeTextBox",
        color: 0x000000,
        width: 2.5
    },
    width: 345,
    height: 105,
    arc: 15,
    offset: OFFSET
}

// Se crea un rectangulo alargado con bordes redondeados que sirve para una caja donde introducir input
export const inputBox : BoxParams = {
    fill: {
        name: "fillInputBox",
        color: 0xffffff
    },
    edge: {
        name: "edgeInputBox",
        color: 0x000000,
        width: 2.5
    },
    width: 335,
    height: 90,
    arc: 15,
    offset: OFFSET
}

// Se crea un cuadrado con bordes redondeados
export const roundedSquare : BoxParams = {
    fill: {
        name: 'fillSquare',
        color: 0xffffff
    },
    edge: {
        name: "edgeSquare",
        color: 0x000000,
        width: 2.5
    },
    width: 100,
    height: 100,
    arc: 10,
    offset: OFFSET
}

export const widerRoundedSquare = structuredClone(roundedSquare);
widerRoundedSquare.fill.name = "fillWiderSquare"
widerRoundedSquare.edge.name = "edgeWiderSqaure"
widerRoundedSquare.edge.width = 5

/**
 * Se utiliza para generar las diferentes texturas que se van a usar en los menus y poder
 * tener un sencillo acceso a los diferentes parametros de cada una (nombre, tam...)
 */
export function generateTextures(scene: Scene) {
    // Se crea un objeto grafico, que sirve para formas primitivas (resulta muy util para dibujar elementos con bordes redondeados)
    // Ademas, si el objeto grafico no va a modificar durante el tiempo es recomendable convertirlo en una textura y usarla
    // para mejorar el rendimiento
    let graphics = scene.add.graphics();

    generateBox(graphics, textBox);

    generateBox(graphics, inputBox);

    generateBox(graphics, roundedSquare);

    // Se crea un cuadrado con bordes redondeados
    generateBox(graphics, widerRoundedSquare);

    graphics.destroy();
}