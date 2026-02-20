import InteractiveContainer from "./interactiveContainer.js";
import { Scene, GameObjects, Tweens } from "phaser";
import TextArea from "./textArea.js";
import { blinkAnimation, fadeAnimation } from "../utils/graphics.js";
import { isTouchInput } from "../../inputDetection.js";
import { fontSizeToInt } from "../utils/misc.js";
import { DEBUG } from "../../types/misc.js";

export default class TextInput extends InteractiveContainer {
    /**
    * Crear una caja interactiva donde introducir texto
    * 
    * @extends {InteractiveContainer}
    * @param {Scene} - escena donde crear la caja
    * @param {number} x - posicion x de la caja de input
    * @param {number} y - posicion y de la caja de input
    * @param {number} width - ancho maximo de la caja
    * @param {number} height - alto maximo de la caja
    * @param {string} defaultText - texto por defecto que se muestra cuando la caja esta vacia
    * @param {Phaser.Types.GameObjects.Text.TextStyle} defaultStyle - configuracion del texto por defecto
    * @param {Phaser.Types.GameObjects.Text.TextStyle} style - configuracion del texto
    */

    textArea: TextArea

    defaultText: string
    defaultStyle: Phaser.Types.GameObjects.Text.TextStyle

    style: Phaser.Types.GameObjects.Text.TextStyle
    text: string

    cursor: GameObjects.Text
    blinkAnim: Tweens.Tween

    isTyping: boolean
    isTextCut: boolean

    inputElement?: HTMLInputElement

    regex: RegExp

    constructor(scene: Scene, x: number, y: number, width: number, height: number, defaultText: string, defaultStyle: Phaser.Types.GameObjects.Text.TextStyle, style: Phaser.Types.GameObjects.Text.TextStyle, isTextCut: boolean = true, originX: number = 0.5, originY: number = 0.5, textOriginX: number = 0, textOriginY: number = 0.5, textPaddingX: number = 0, textPaddingY: number = 0, textOffsetX: number = 0, textOffsetY: number = 0, textAligX: number = 0.5, textAlignY: number = 0.5, regex: RegExp = /[\p{L}\p{M}\p{P}\p{Zs}]/u) {
        super(scene, x, y);

        this.textArea = new TextArea(scene, 0, 0, width, height, defaultText, defaultStyle, textOriginX, textOriginY, textPaddingX, textPaddingY, textOffsetX, textOffsetY, textAligX, textAlignY)
        this.textArea.adjustFontSize();
        this.add(this.textArea);

        // Se obtiene el tamano de fuente reducida
        let fontSize = this.textArea.getFontSize();
        if (typeof fontSize == "string") {
            fontSize = fontSizeToInt(fontSize);
        }

        this.defaultText = defaultText;
        this.defaultStyle = { ...defaultStyle };
        this.defaultStyle.fontSize = fontSize;

        this.text = "";
        this.style = { ...style };
        let styleFontSize = this.textArea.getFontSize();
        if (typeof styleFontSize == "string") {
            styleFontSize = fontSizeToInt(styleFontSize);
        }
        this.style.fontSize = Math.min(fontSize, styleFontSize);

        this.cursor = this.scene.add.text(0, 0, "▌", style);
        this.add(this.cursor);

        const rect = this.scene.add.rectangle(0, 0, width + this.cursor.displayWidth, height);
        if (DEBUG) {
            rect.setStrokeStyle(2, 0xff0000)
        }
        rect.setOrigin(originX, originY)
        this.add(rect);

        const textX = rect.x + rect.displayWidth * (0.5 - originX);
        const textY = rect.y + rect.displayHeight * (0.5 - originY);
        this.textArea.setPosition(textX, textY);

        // Crear el cursor visual que parpadea mientras se escribe
        this.cursor.setPosition(this.textArea.x, this.textArea.y);
        this.cursor.setOrigin(textOriginX, textOriginY)

        this.calculateRectangleSize();
        this.setInteractive();

        const animation = this.activateCursor(false);
        animation.on("complete", () => {
            this.blinkAnim = blinkAnimation(this.cursor, 300, 600);
            this.cursor.setVisible(false);
        })

        this.regex = regex;
        this.isTyping = false;
        this.isTextCut = isTextCut;

        // Habilitar el uso del teclado fisico
        this.enableKeyboard();

        // Habilitar el uso del teclado virtual (pantallas tactiles)
        this.inputElement = this.createInput();

        this.on("pointerdown", this.onInput);

        this.bringToTop(this.textArea)
        this.bringToTop(this.cursor);
    }

    enableKeyboard() {
        // Detectar la pulsacion de teclas fisicas
        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            keyboard.on("keydown", (event: KeyboardEvent) => {
                if (!isTouchInput() && this.isTyping) {
                    let change = false;

                    let text = this.text;
                    // Eliminar el ultimo caracter si se pulsa retroceso
                    if (text.length > 0 && event.key === "Backspace") {
                        change = true;
                        text = text.slice(0, -1);
                    }

                    // Añadir caracteres validos al texto
                    else if (event.key.length === 1 && event.key.match(this.regex)) {
                        change = true;
                        text += event.key;
                    }

                    if (change) {
                        this.setText(text);
                    }
                }
            });
        }
    }

    createInput() {
        // Crear un input inivisible del DOM para el teclado virtual
        const input = document.createElement("input") as HTMLInputElement;

        // Identificación (evita warnings)
        input.id = "virtual-keyboard-input";
        input.name = "virtualKeyboardInput";

        // Configuración básica
        input.type = "text";
        input.autocomplete = "off";
        input.autocapitalize = "off";
        input.spellcheck = false;

        Object.assign(input.style, {
            position: "fixed",
            top: "0",
            left: "0",
            opacity: "0",
            pointerEvents: "none"
        });

        document.body.appendChild(input);

        // Se detecta la entrada de texto en el teclado virtual
        input.addEventListener("input", _ => {
            if (isTouchInput()) {
                // Se cambia el valor del texto por el valor del input
                this.text = input.value;
                this.setText(this.text);
            }
        });

        // Se suaviza la aparicion del teclado virtual
        input.addEventListener("focus", () => {
            input.scrollIntoView({ behavior: "smooth" });
        });

        // Cuando se pulsa en la pantalla, se sustituye el valor del input
        // por el texto, por si previamente se habia escribo con el teclado regular
        window.addEventListener("touchstart", () => {
            input.value = this.text;
        });

        // Si se usa el raton, desaparece el teclado virtual
        window.addEventListener("mousedown", () => {
            input.blur();
        });

        return input;
    }

    setText(text: string) {
        const fits = this.textArea.fits(text);
        if (this.isTextCut || fits) {
            this.text = text;
            this.textArea.setText(text);
        }

        if (this.isTextCut) {
            // Se eliminan caracteres por la izquierda para que no se salga del rectangulo permitido
            this.textArea.adjustTextLength(true);
        }
        // Se desplaza el cursor
        const textSize = this.textArea.getTextSize();
        const lines = this.textArea.getLines();
        const width = this.textArea.getDisplayWidth(lines[textSize.lines - 1])
        this.cursor.x = this.textArea.x + width;
        const totalHeight = (textSize.lineHeight + (this.style.lineSpacing ?? 0)) * (textSize.lines - 1);
        this.cursor.y = this.textArea.y + totalHeight * (1 - this.textArea.originY);
    }

    activateInput(active: boolean) {
        if (active) {
            // Si no hay texto escrito, es que estaba el texto por defecto, por lo tanto, hay que eliminarlo
            if (!this.containsText()) {
                this.setText(this.text);
                this.textArea.setStyle(this.style);
            }

            this.disableInteractive();

            // Se activa el cursor
            const animation = this.activateCursor(true);
            animation.on("complete", () => {
                // Se comienza escribir
                this.isTyping = true;
                // Se desactiva la interaccion para no volver a pulsar la caja mientras se esta escribiendo

                // Se muestra el teclado en pantalla si es necesario
                if (isTouchInput()) {
                    this.inputElement?.focus();
                }
            })
            return animation;
        }
        else {
            // Se oculta el teclado virtual
            if (isTouchInput()) {
                this.inputElement?.blur();
            }

            // Se deja de escribir
            this.isTyping = false;

            // Se desactiva el cursor
            const animation = this.activateCursor(false);
            animation.on("complete", () => {
                // Se puede volver a interactuar con la caja y, por lo tanto, escribir
                this.setInteractive();

                // Si no hay ningun texto, se muestra el por defecto
                if (!this.containsText()) {
                    this.textArea.setText(this.defaultText)
                    this.textArea.setStyle(this.defaultStyle);
                }
            })
            return animation;
        }
    }

    onInput() {
        const animation = this.activateInput(true);
        animation.on("complete", () => {
            // Se habilita dejar de escribir pulsando en cualquier lado de la pantalla.
            // Se necesita un temporizador para que no salten los dos eventos de "pointerdown" a la vez
            setTimeout(() => {
                this.scene.input.once("pointerdown", () => {
                    this.activateInput(false);
                })
            }, 10);
        })
    }

    activateCursor(active: boolean, duration: number = 10) {
        const animation = fadeAnimation(this.cursor, active, duration);
        return animation;
    }

    getText() {
        return this.text;
    }

    containsText() {
        return this.text !== "";
    }

    clear() {
        this.setText("");
        this.activateInput(false);
    }

    destroy() {
        super.destroy();
        // Se elimina el input del DOM
        this.inputElement?.remove();
        this.inputElement = undefined;
    }

    enableTyping(enable: boolean) {
        if (enable) {
            this.on("pointerdown", this.onInput);
            this.inputElement = this.createInput();
        }
        else {
            this.off("pointerdown", this.onInput)
            this.inputElement?.remove();
            this.inputElement = undefined;
        }
    }
}