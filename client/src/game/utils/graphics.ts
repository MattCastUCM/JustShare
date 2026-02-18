import { Scene, GameObjects, Tweens, Types } from "phaser";
import { setInteractive } from "./misc";

// Configuracion de texto por defecto
export const TEXT_CONFIG: Types.GameObjects.Text.TextStyle = {
    fontFamily: 'Arial',        // Fuente (tiene que estar precargada en el html o el css)
    fontSize: '25px',        // Tamano de la fuente del dialogo
    fontStyle: 'normal',        // Estilo de la fuente
    backgroundColor: undefined,      // Color del fondo del texto
    color: '#ffffff',           // Color del texto
    stroke: '#000000',          // Color del borde del texto
    strokeThickness: 0,         // Grosor del borde del texto 
    align: 'left',              // Alineacion del texto ('left', 'center', 'right', 'justify')
    wordWrap: undefined,
    padding: undefined               // Separacion con el fondo (en el caso de que haya fondo)
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
        const rgb: RGB = {
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

type RenderComponents =
    GameObjects.Components.Visible &
    GameObjects.Components.AlphaSingle &
    GameObjects.Components.Transform;

export type RenderObject = GameObjects.GameObject & RenderComponents;

/**
* Anadir animacion de mostrar/ocultar un objeto con un fade in/out
* @param {GameObjects.Components.Visible, Array} targets - elemento/s que haran la animacion
* @param {boolean} makeVisible - true si se quiere mostrar el objetivo, false en caso contrario
* @param {number} duration - duracion en ms que durara el fade (opcional)
* @param {Phaser.Math., string} ease - funcion de suavizado que aplicar a la animacion (opcional)
* @returns {Tweens.Tween} - instancia de la animacion reproducida (por si se quieren anadir eventos que reaccionen a ella)
*/
export function fadeAnimation(targets: RenderObject | RenderObject[], makeVisible: boolean, duration: number = 150, ease: Function | string = Phaser.Math.Easing.Linear) {
    let targetArr: RenderObject[] = []
    let mainTarget: RenderObject | undefined = undefined;
    let visible = false;

    if (Array.isArray(targets)) {
        targetArr = targets
        mainTarget = targets[0];
        visible = mainTarget.visible;
    }
    else {
        targetArr = [targets]
        mainTarget = targets;
        visible = targets.visible;
    }

    // Configura el alpha y la duracion segun la visibilidad del objetivo y el estado al que se quiere pasar
    let initAlpha = mainTarget.alpha;
    let endAlpha = 1;
    if (!makeVisible) {
        initAlpha = mainTarget.alpha;
        endAlpha = 0;
    }

    // Si la visibilidad que se le va a poner al objeto es la misma que la que ya tiene, 
    // el alpha inicial y final seran iguales y la duracion de la animacion sera 0
    if (makeVisible == visible) {
        initAlpha = endAlpha;
        duration = 0;
    }
    // Si no, fuerza la opacidad a la inicial
    else {
        targetArr.forEach((elem) => {
            elem.setVisible(true);
            elem.setAlpha(initAlpha);
        });
    }

    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: targetArr,
        alpha: { from: initAlpha, to: endAlpha },
        ease: ease,
        duration: duration,
        repeat: 0
    }

    let anim = mainTarget.scene.tweens.add(config);
    anim.on("complete", () => {
        targetArr.forEach(elem => {
            elem.setVisible(makeVisible);
        })
    });

    return anim;
}

export function blinkAnimation(target: RenderObject, duration: number, hold: number, ease: Function | string = Phaser.Math.Easing.Linear, repeat: number = -1) {
    const config: Phaser.Types.Tweens.TweenBuilderConfig = {
        targets: target,
        alpha: 1 - target.alpha,
        duration: duration,
        ease: ease,
        hold: hold,
        yoyo: true,
        repeat: repeat,
    }

    const anim = target.scene.tweens.add(config);

    if (repeat >= 0) {
        anim.on("complete", () => {
            target.setVisible(target.alpha > 0)
        })
    }

    target.setVisible(true);

    return anim
}

/**
* Prepara el boton para anadirle posteriormente una animacion
* @param {RenderObject} button - elemento que reaccionara a los eventos del raton
* @param {Boolean} overrideOnClick - true si se quieren sustituir todos los callbacks que tuviera el objeto en su evento pointerdown, false en caso contrario 
*/
function prepareButtonInteraction(button: RenderObject, overrideOnClick = false) {
    setInteractive(button);

    if (overrideOnClick) {
        button.off("pointerdown");
    }
}

/**
* Una vez terminada la animacion indicada, se ejecuta el onClick y se reactiva la interaccion si no es una interaccion unica
* @param {RenderObject} button - elemento que reaccionara a los eventos del raton
* @param {Tweens.Tween} anim - tween que esperar a que termine
* @param {Function} onClick - funcion a llamar al pulsar el boton
* @param {boolean} single - true si se puede volver a interactuar con el elemento, false en caso contrario
*/
function buttonInteractionComplete(button: RenderObject, anim: Tweens.Tween, onClick: Function, single: boolean) {
    anim.on("complete", () => {
        if (!single) {
            button.setInteractive();
        }

        if (onClick != null && typeof onClick == "function") {
            onClick();
        }
    });
}

/**
* Anadir animacion de cambio de color al pasar y quitar el raton por encima
* @param {GameObjects.GameObject} button - elemento que reaccionara a los eventos del raton
* @param {GameObjects.GameObject, Array} targets - objetos que cambiar de color 
* @param {Function} onClick - funcion a llamar al pulsar el boton
* @param {boolean} overrideOnClick - true si se quieren sustituir todos los callbacks que tuviera el objeto en su evento pointerdown, false en caso contrario 
* @param {boolean} single - true si se puede volver a interactuar con el elemento, false en caso contrario
* @param {number} scaleFactor - factor para disminuir o aumentar la escala del boton al pasar el puntero por encima
* @param {number} duration - tiempo que dura la animacino
*/
export function growAnimation(button: RenderObject, targets: RenderObject[], onClick = () => { }, overrideOnClick = false, single = false, scaleFactor = 1.1, duration = 20) {
    prepareButtonInteraction(button, overrideOnClick);

    let originalScale = button.scale;

    // Al pasar el raton por encima del icono, se hace mas grande
    button.on("pointerover", () => {
        button.scene.tweens.add({
            targets: targets,
            scale: originalScale * scaleFactor,
            duration: duration,
            repeat: 0,
        });
    });
    // Al quitar el raton de encima vuelve a su tamano original
    button.on("pointerout", () => {
        button.scene.tweens.add({
            targets: targets,
            scale: originalScale,
            duration: duration,
            repeat: 0,
        });
    });
    // Al pulsar, se hace pequeno y grande de nuevo y se activa/desactiva el telefono
    button.on("pointerdown", () => {
        button.disableInteractive();
        let anim = button.scene.tweens.add({
            targets: targets,
            scale: originalScale,
            duration: duration,
            repeat: 0,
            yoyo: true
        });

        // Al terminar la animacion se ejecucta el onClick
        buttonInteractionComplete(button, anim, onClick, single);
    });
}