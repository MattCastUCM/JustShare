import { Scene, GameObjects } from "phaser";
import { TEXT_CONFIG } from "../../utils/graphics";
import { setInteractive } from "../../utils/misc";
import DialogManager from "../../managers/dialogManager";
import DialogObject from "./dialogObject";
import { Dialog } from "./dialogNode";

export default class TextBox extends DialogObject {
    /**
    * Caja de texto para los dialogos
    * @extends DialogObject
    * @param {Scene} scene - escena a la que pertenece
    */

    PADDING: number
    box: GameObjects.Image
    TEXT_X: number
    TEXT_Y: number
    WIDTH: number
    HEIGHT: number
    NAME_X: number
    NAME_Y: number
    centered: boolean
    defaultNormalTextConfig: Phaser.Types.GameObjects.Text.TextStyle
    normalTextConfig: Phaser.Types.GameObjects.Text.TextStyle
    defaultNameTextConfig: Phaser.Types.GameObjects.Text.TextStyle
    nameTextConfig: Phaser.Types.GameObjects.Text.TextStyle
    TEXT_DELAY: number
    currText: GameObjects.Text
    fullText: string
    fullTextSplit: string[]
    letterCount: number
    finished: boolean
    nameText: GameObjects.Text
    canWrite: boolean
    timedEvent: Phaser.Time.TimerEvent
    CANVAS_WIDTH: number

    public constructor(scene: Scene, dialogManager: DialogManager) {
        super(scene);
        this.scene = scene;

        // Configuracion de la imagen de la caja de texto
        this.PADDING = 10;        // Espacio entre la caja y los bordes del canvas

        this.CANVAS_WIDTH = this.scene.sys.canvas.width;
        const canvasHeight = this.scene.sys.canvas.height;

        // Imagen de la caja
        this.box = scene.add.image(this.CANVAS_WIDTH / 2, canvasHeight - this.PADDING, 'textbox').setOrigin(0.5, 1);
        // this.box = scene.add.image(this.scene.CANVAS_WIDTH / 2, this.scene.CANVAS_HEIGHT - this.PADDING, 'dialogs', 'textbox').setOrigin(0.5, 1);

        this.box.visible = true;

        setInteractive(this.box);
        this.box.on('pointerdown', () => {
            dialogManager.nextDialog();
        });

        // Dimensiones y posiciones
        this.TEXT_X = 250;      // Posicion X del texto
        this.TEXT_Y = 635;      // Posicion Y del texo
        this.WIDTH = 1100;       // Ancho que va a ocupar el texto
        this.HEIGHT = 200;      // Alto que va a ocupar el texto

        this.NAME_X = 450;      // Posicion X del nombre
        this.NAME_Y = 578;      // Posicion Y del nombre

        // Depurar el tamano real de la caja de texto
        // this.graphics = scene.add.graphics();
        // this.graphics.fillStyle('black', 0.9);
        // this.graphics.fillRect(this.scene.CANVAS_WIDTH / 2 - this.WIDTH / 2, this.TEXT_Y, this.WIDTH, this.HEIGHT);

        // Indica si el texto de la caja esta centrado o no
        this.centered = false;

        // Configuracion por defecto del texto de la caja
        this.defaultNormalTextConfig = { ...TEXT_CONFIG };
        this.defaultNormalTextConfig.fontFamily = 'roboto-regular';
        this.defaultNormalTextConfig.fontSize = 35 + 'px';
        this.defaultNormalTextConfig.color = '#000000';
        this.defaultNormalTextConfig.lineSpacing = 10;

        // Inicialmente la configuracion del texto de la caja es la de por defecto
        this.normalTextConfig = { ...this.defaultNormalTextConfig };

        // Configuracion por defecto del texto del nombre
        this.defaultNameTextConfig = { ...TEXT_CONFIG };
        this.defaultNameTextConfig.fontFamily = 'roboto-regular';
        this.defaultNameTextConfig.fontStyle = 'bold';
        this.defaultNameTextConfig.fontSize = 35 + 'px';

        // Inicialmente la configuracion del texto del nombre la por defecto
        this.nameTextConfig = { ...this.defaultNameTextConfig };

        // Animacion del texto
        this.TEXT_DELAY = 30;                                                        // Tiempo que tarda en aparecer cada letra en milisegundos
        this.currText = this.scene.add.text(0, 0, "", this.normalTextConfig);       // Texto escrito hasta el momento
        this.fullText = "";                                                         // Texto completo a escribir
        this.fullTextSplit = [];                                                  // Texto completo a escribir separado por palabras
        this.letterCount = 0;                                                       // Numero de letras del texto completo escritas
        this.finished = false;                                                      // Si ha terminado de mostrar el texto o no

        this.nameText = this.scene.add.text(0, 0, "", this.nameTextConfig);
        this.canWrite = false;

        this.box.alpha = 0;
        this.currText.alpha = 0;
        this.nameText.alpha = 0;
    }

    public setDepth(depth: number) {
        this.box.setDepth(depth);
        this.currText.setDepth(depth);
        this.nameText.setDepth(depth);
        return this;
    }

    /**
    * Cambia el texto de la caja
    * @param {String} text - texto a escribir
    * @param {Boolean} animate - si se va a animar el texto o no
    */
    setText(dialogInfo: Dialog, animate: boolean) {
        // Limpia los eventos
        if (this.timedEvent) this.timedEvent.remove();

        // Reinicia el numero de letras escritas y se separa
        // cada caracter del texto completo en un array
        this.letterCount = 0;
        this.fullText = dialogInfo.text;
        this.fullTextSplit = dialogInfo.text.split('');

        // Si el texto es animado, el texto inicial esta vacio
        // si no, el texto inicial es el texto completo
        let tempText = dialogInfo.text;
        this.finished = true;
        if (animate) {
            tempText = '';
            this.finished = false;
        }

        // Se crea el texto que se va a escribir y el nombre del personaje
        this.changeText(tempText);
        this.changeName(dialogInfo.name);

        if (animate) {
            // Se crea el evento 
            this.timedEvent = this.scene.time.addEvent({
                delay: this.TEXT_DELAY,
                callback: this.animateText,
                callbackScope: this,
                loop: true
            });
        }
    }

    /**
    * Cambia el texto que se muestra por pantalla
    * @param {String} text - texto a escribir
    */
    changeText(text: string) {
        // Arriba a la izquierda y con retrato
        let x = this.TEXT_X;
        let y = this.TEXT_Y;
        let width = this.WIDTH;

        // Centrado
        if (this.centered) {
            x = this.box.x;
            y = this.box.y - this.box.displayHeight / 2.25;
            width = (this.CANVAS_WIDTH - this.PADDING * 2) / 1.30;
        }

        this.normalTextConfig.wordWrap = {
            width: width,
            useAdvancedWrap: true
        }

        // Crea el texto en la escena
        this.currText.x = x;
        this.currText.y = y;
        this.currText.setStyle(this.normalTextConfig);
        this.currText.setText(text);
    }

    /**
    * Cambia el texto del nombre del personaje hablando
    * @param {String} name - nombre del personaje
    */
    changeName(name: string) {
        // Crea el texto en la escena
        this.nameText.setOrigin(0.5, 0.5);
        this.nameText.x = this.NAME_X;
        this.nameText.y = this.NAME_Y;

        // Cambia el texto del objeto
        this.nameText.setText(name);
        this.nameText.setStyle(this.nameTextConfig);
    }

    /**
    * Devuelve si el texto de la caja supera la altura maxima
    * @returns {boolean} - true si la caja supera la altura maxima, false en caso contrario
    */
    textTooBig() {
        return (this.currText.getBounds().height > this.HEIGHT);
    }


    // Anima el texto para que vaya apareciendo caracter a caracter
    animateText() {
        if (this.canWrite) {
            // Actualiza el numero de letras
            this.letterCount++;

            // Cambia el texto a mostrar por el texto actual + el nuevo caracter a escribir
            this.currText.setText(this.currText.text + this.fullTextSplit[this.letterCount - 1]);

            // Si se ya se han escrito todos los caracteres, elimina el evento
            if (this.letterCount === this.fullTextSplit.length) {
                this.timedEvent.remove();
                this.finished = true;
            }
        }

    }

    // Muestra de golpe el dialogo completo
    forceFinish() {
        if (this.timedEvent) this.timedEvent.remove();
        this.finished = true;
        if (this.currText) this.currText.setText(this.fullText);
    }

    /**
    * Activa/desactiva el cuadro de texto y ejecuta la funcion o lambda que se le
    * pase como parametro una vez haya terminado la animacion y el retardo indicado
    * @param {Boolean} active - si se va a activar
    * @param {Function} onComplete - funcion a la que llamar cuando acabe la animacion
    * @param {Number} delay - tiempo en ms que tarda en llamarse a onComplete
    */
    public activate(active: boolean, onComplete: Function = () => { }, delay: number = 0) {
        // Es visible si el alpha de la caja es 1
        let isVisible = this.box.alpha == 1;

        // Si se va a activar y no es visible, aparece con animacion.
        if (active && !isVisible) {
            this.canWrite = false;

            this.box.disableInteractive();
            super.activate_internal(true, [this.box, this.currText, this.nameText], () => {
                setTimeout(() => {
                    this.box.setInteractive({ useHandCursor: true });
                    this.canWrite = true;
                }, 200);
            }, 0);
        }
        // Si se va a desactivar y es visible, desaparece con animacion
        else if (!active && isVisible) {
            this.box.disableInteractive();
            this.canWrite = false;

            super.activate_internal(false, [this.box, this.currText, this.nameText], onComplete, delay);
        }
        // Si se va a desactivar y no era visible, se llama a la funcion que se ha pasado
        else if (!active && !isVisible) {
            if (onComplete !== null && typeof onComplete === 'function') {
                setTimeout(() => {
                    onComplete();
                }, delay);

            }
        }
    }

    /**
     * Se resetea la configuracion del texto de la caja a la por defecto
     */
    resetTextConfig() {
        this.normalTextConfig = { ...this.defaultNormalTextConfig };
        // Por si acaso
        if (this.centered) {
            this.normalTextConfig.align = 'center';
        }
        this.nameTextConfig = { ...this.defaultNameTextConfig };
    }

    /**
     * Alinear el texto de la caja al centro o arriba a la izquierda
     * @param {Boolean} centered - true si el texto esta centrado, false si esta arriba a la izquierda
     */
    centerText(centered: boolean) {
        this.centered = centered;

        this.normalTextConfig.align = 'left';
        this.currText.setOrigin(0);
        if (this.centered) {
            this.normalTextConfig.align = 'center';
            this.currText.setOrigin(0.5);
        }
    }
}