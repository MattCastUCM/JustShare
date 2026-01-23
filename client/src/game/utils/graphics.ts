import { Scene } from "phaser";

// Configuracion de texto por defecto
export const TEXT_CONFIG = {
    fontFamily: 'Arial',        // Fuente (tiene que estar precargada en el html o el css)
    fontSize: '25px',        // Tamano de la fuente del dialogo
    fontStyle: 'normal',        // Estilo de la fuente
    backgroundColor: null,      // Color del fondo del texto
    color: '#ffffff',           // Color del texto
    stroke: '#000000',          // Color del borde del texto
    strokeThickness: 0,         // Grosor del borde del texto 
    align: 'left',              // Alineacion del texto ('left', 'center', 'right', 'justify')
    wordWrap: null,
    padding: null               // Separacion con el fondo (en el caso de que haya fondo)
}

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

/**
* Crea una textura a partir de un rectangulo con las caracteristicas indicadas
* @param {Scene} scene - escena con acceso a las texturas existentes
* @param {string} textureId - id de la textura que se creara para el rectangulo. Si no se especifica, se reutilizara la del primer rectangulo sin id que se cree
* @param {number} width - ancho del rectangulo
* @param {number} height - alto del rectangulo
* @param {number} fillColor - valor hex del color por defecto del rectangulo (opcional)
* @param {Number} fillAlpha - alpha del rectangulo [0-1] (opcional) 
* @param {number} borderThickness - ancho del borde del rectangulo (opcional)
* @param {number} borderColor - valor hex del color por defecto del borde (opcional)
* @param {number} borderAlpha - alpha del borde [0-1] (opcional)
* @param {number} radiusPercentage - valor en porcentaje del radio de los bordes [0-100] (opcional)
*/
export function createRectTexture(scene: Scene, textureId: string, width: number, height: number, fillColor: number = 0xffffff, fillAlpha: number = 1, borderThickness: number = 5, borderColor: number = 0x000000, borderAlpha: number = 1, radiusPercentage: number = 0) {
    if (!scene.textures.exists(textureId)) {
        // Se crea el rectangulo con el borde
        let graphics = scene.add.graphics();
        graphics.fillStyle(fillColor, fillAlpha);
        graphics.lineStyle(borderThickness, borderColor, borderAlpha);

        // Se calcula el radio y se rellenan el rectangulo y el borde redondeados
        let radius = Math.min(width, height) * (radiusPercentage / 100);
        graphics.fillRoundedRect(borderThickness, borderThickness, width, height, radius);
        graphics.strokeRoundedRect(borderThickness, borderThickness, width, height, radius);

        // Se crea la textura a utilizar para el fondo
        graphics.generateTexture(textureId, width + borderThickness * 2, height + borderThickness * 2);
        graphics.destroy();
    }
}