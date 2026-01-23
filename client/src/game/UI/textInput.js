import { Scene, GameObjects, Display } from "phaser"
const { GetColor, IntegerToRGB, HexStringToColor } = Display.Color;
const { ColorWithColor } = Display.Color.Interpolate
import GameManager from "../managers/gameManager";
import { isTouchInput } from "../../inputDetection"
import { TEXT_CONFIG } from "../utils/graphics";

export default class TextInput extends GameObjects.Container {
    /**
    * Clase que permite crear una caja de texto donde poder escribir
    * @param {Scene} scene - escena a la que pertenece
    * @param {number} x - posicion x
    * @param {number} y - posicion y
    * @param {string} defaultText - texto por defecto que aparece en la caja si no se ha escrito nada aun
    * @param {number} offset - punto a partir del cual se comienza a escribir el texto para que todo este bien ajustado
    * @param {Color} pressedCol - color RGB al que se cambia cuando se produce la animacion de comenzar a escribir en la caja
    * @param {string} fill - sprite que se usa para el relleno
    * @param {string} style - tipografia (opcional)
    */
    constructor(scene, x, y, defaultText, offset, pressedColor, fill, style = {}, writeLocked = false) {
        super(scene, x, y);

        this.scene.add.existing(this);

        let gameManager = GameManager.getInstance();

        // Relleno del cuadro de texto
        // Es la parte interactuable
        this.fillImg = this.scene.add.image(0, 0, fill);
        this.fillImg.setOrigin(0, 0.5);
        this.fillImg.setInteractive({ useHandCursor: true });

        let debug = this.scene.sys.game.debug;
        if (debug.enable) {
            this.scene.input.enableDebug(this.fillImg, debug.color);
        }
        this.add(this.fillImg);

        this.offset = offset;

        // El texto por defecto aparece en cursiva y con cierto grado de transparencia
        this.defaultTextAlpha = 0.3;
        this.defaultText = defaultText;

        // Inicialmente no hay texto escrito
        this.currentText = "";

        // Texto donde se escribe (inicialmetne esta vacio)
        this.text = this.scene.add.text(this.offset, 0, this.defaultText, style);
        this.text.setAlpha(this.defaultTextAlpha).setOrigin(0, 0.5).setFontStyle('italic');
        this.add(this.text);

        // Indicar si el usuario esta escribiendo o no
        this.isEnteringName = false;

        // Texto para simular el cursor
        // (se trata como un elemento aparte para poder acercarle mas al texto escrito)
        this.cursor = this.scene.add.text(0, 0, '|', style);
        this.cursor.setAlpha(0).setOrigin(0, 0.5);
        this.add(this.cursor);

        // Tween para simular que el cursor aparece y desaparece
        this.cursorTween = this.scene.tweens.add({
            targets: this.cursor,
            alpha: 1,
            duration: 300,
            hold: 600,          // tiempo en milisegundos para que el tween haga yoyo
            yoyo: true,
            repeat: -1,
            paused: true
        });

        let nCol = HexStringToColor('#ffffff');
        let pCol = GetColor(pressedColor.R, pressedColor.G, pressedColor.B);
        pCol = IntegerToRGB(pCol);

        // Se cambia el color de la caja al pasar el raton
        this.fillImg.on('pointerover', () => {
            scene.tweens.addCounter({
                targets: this.fillImg,
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(nCol, pCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: 50,
                repeat: 0,
            });
        });

        // Se cambia el color de la caja al sacar el raton
        this.fillImg.on('pointerout', () => {
            scene.tweens.addCounter({
                targets: this.fillImg,
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(pCol, nCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: 50,
                repeat: 0,
            });
        });

        // Se clica en la caja
        this.fillImg.on('pointerup', () => {
            // Si se clica en la caja de texto, es que el usuario quiere escribir en la caja
            if (!this.isEnteringName) {
                // Si no hay texto escrito, se quita el texto por defecto
                if (this.currentText === "") {
                    this.setText(this.currentText);
                    this.text.setAlpha(1).setFontStyle('normal');
                }

                // Se activa el cursor
                this.cursor.setAlpha(0);
                this.cursorTween.resume();

                // Se realiza la animacion de la caja cuando se ha clicado
                scene.tweens.addCounter({
                    targets: this.fillImg,
                    from: 0,
                    to: 100,
                    onUpdate: (tween) => {
                        const value = tween.getValue();
                        let col = ColorWithColor(nCol, pCol, 100, value);
                        let colInt = GetColor(col.r, col.g, col.b);
                        this.fillImg.setTint(colInt);
                    },
                    duration: 50,
                    repeat: 0,
                    yoyo: true
                });

                if (isTouchInput && this.hiddenInput) {
                    // Aparece el teclado en pantalla
                    this.hiddenInput.focus();
                }

                this.isEnteringName = true;

                // Habilitar el salir de la caja y dejar de escribir
                // Se tiene que hacer con un pequeño temporizador porque sino saltarian los dos eventos
                // de pointerup a la vez y entonces, no se podria llegar a escribir
                setTimeout(() => {
                    this.deactiveInput();
                }, 10);

            }
        })

        if (!writeLocked) {
            this.typeWithOnScreenKeyboard();
            this.typeWithKeyboard();

            // Pantalla tactil (se usa el teclado virtual)
            window.addEventListener('touchstart', () => {
                this.hiddenInput.value = this.currentText;
            });

            // Se usa el teclado fisico
            window.addEventListener('mousedown', () => {
                this.hiddenInput.blur();
            });
        }
        else {
            this.hiddenInput = null;
        }

        const dims = this.getBounds();
        this.setSize(dims.width, dims.height);
    }

    /**
     * Escribir texto en la caja si la pantalla no es tactil (se usa el teclado fisico)
     */
    typeWithKeyboard() {
        this.scene.input.keyboard.on('keydown', (event) => {
            if (!isTouchInput) {
                // Si se esta escribiendo en la caja, se van procesando las letras que se pulsan en el teclado
                if (this.isEnteringName) {
                    let hasChanged = false;
                    // Borrar caracter
                    if (event.keyCode === 8 && this.currentText.length > 0) {
                        hasChanged = true;
                        this.currentText = this.currentText.slice(0, -1);
                    }
                    // Escribir un nuevo caracter
                    // Nota: \s --> espacio
                    else if (event.key.length === 1 && event.key.match(/[a-zA-Z0-9\s]/)) {
                        hasChanged = true;
                        this.currentText += event.key;
                    }

                    // Se puede escribir en la caja mas caracteres de los que visualmente caben.
                    // Sin embargo, solo se van a mostrar los ultimos
                    if (hasChanged) {
                        this.adjustTextToBox();
                    }
                }
            }
        });
    }

    /**
     * Escribir texto en la caja si la pantalla es tactil (se usa el teclado virtual)
     * Se utiliza una caja de input del DOM para poder tener acceso al teclado virtual, pero
     * se hace invisible la propia caja de input porque no interesa que se muestre
     */
    typeWithOnScreenKeyboard() {
        // Se crea la caja del input del DOM
        this.hiddenInput = document.createElement('input');
        // Se coloca en un lugar en pantalla que no genere mas espacio
        this.hiddenInput.style.position = 'absolute';
        this.hiddenInput.style.top = '50px';
        this.hiddenInput.style.left = '50px';
        // Se hace invisible: opacity a 0 para que no se vea, pero se siga pudiendo interactuar con ella
        // y zIndex a -1 para que se coloque debajo de cualquier objeto (por si acaso)
        this.hiddenInput.style.opacity = '0';
        this.hiddenInput.style.zIndex = '-1';
        // Se coloca en el documento
        document.body.appendChild(this.hiddenInput);

        this.hiddenInput.addEventListener('input', (event) => {
            if (isTouchInput) {
                // El valor escrito en la caja de input del DOM escribe en la de la clase
                this.currentText = event.target.value;
                this.adjustTextToBox();
            }
        });

        // Hacer que la aparicion del teclado virtual sea suave
        this.hiddenInput.addEventListener('focus', () => {
            this.hiddenInput.scrollIntoView({ behavior: 'smooth' });
        });
    }

    /**
     * Ajustar el texto al ancho de la caja, de modo que solo se muestran los caracteres que visualmente caben
     * Se pueden escribir mas caracteres de los que visualmente caben, pero solo se van a mostrar los ultimos
     */
    adjustTextToBox() {
        // Se comprueba si el texto actual se puede mostrar visualmente entero en la caja
        this.setText(this.currentText);
        let cont = 1;
        // Si no caben todos los caracteres, se van quitando uno a uno del principio
        // hasta encontrar cual es el maximo que se puede mostrar visualmente
        while (this.text.width >= this.fillImg.displayWidth - this.offset * 2) {
            let aux = this.currentText.slice(-(this.currentText.length - cont));
            this.setText(aux);
            ++cont;
        }
    }

    deactiveInput() {
        // Se desactiva cualquier evento de pointerup que pudiera haber en la escena
        // (No es necesario, pero se hace por si acaso)
        this.scene.input.off('pointerup');
        // Se activa un evento de pointerup que se produce una sola vez al clicar en cualquier
        // lugar de la escena
        // Nota: los eventos de la escena tienen preferencia a los eventos de los objetos
        // Por lo tanto, pulsar en la escena no va a colisionar con pulsar en otra caja. Si este evento
        // estuviera activado, y se pulsara en una caja, seria este el que se lanzara y no el de la caja
        this.scene.input.once('pointerup', () => {
            // Se desactiva el poder escribir
            if (this.isEnteringName) {
                this.deactiveBox();

                if (isTouchInput && this.hiddenInput) {
                    // Desaparece el teclado en pantalla
                    this.hiddenInput.blur();
                }
            }
        })
    }

    deactiveBox() {
        this.isEnteringName = false;

        // Se deja el texto ya escrito o si no se ha escrito ningun
        // texto, se vuelve al texto por defecto
        if (!this.currentText) {
            this.setDefaultText();
        }

        // Se desactiva el cursor
        this.cursor.setAlpha(0);
        this.cursorTween.pause();
    }

    setText(text) {
        this.text.setText(text);
        this.cursor.x = this.text.x + this.text.width - 4;
    }

    getText() {
        return this.currentText;
    }

    isValid() {
        let aux = this.currentText !== "";
        return aux;
    }

    reset() {
        this.isEnteringName = false;
        this.currentText = "";
        this.setDefaultText();
        this.cursor.setAlpha(0);
        this.cursorTween.pause();
    }

    setDefaultText() {
        this.setText(this.defaultText);
        this.text.setAlpha(this.defaultTextAlpha).setFontStyle('italic');
    }

    /**
     * Eliminar la caja de input del DOM de la escena
     * Nota: conviene usar este metodo al destruir la escena donde se ha creado este objeto
     * porque la caja de input del DOM no se va a utilizar mas
     */
    removeHiddenInput() {
        this.hiddenInput.remove();
    }

    addText(text) {
        this.currentText = text;
        this.text.setAlpha(1).setFontStyle('normal');
        this.adjustTextToBox();
    }
}