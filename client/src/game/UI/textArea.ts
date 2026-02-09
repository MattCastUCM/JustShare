import { GameObjects, Scene } from "phaser"
import { fontSizeToInt, range } from "../utils/misc.js";
import { DEBUG } from "../../types/misc.js";

export default class TextArea extends GameObjects.Text {
    /**
    * Texto que tiene que estar contenido en un area especifica
    * @extends GameObjects.Text
    * @param {Scene} scene - escena en la que se crea
    * @param {number} x - posicion x del texto (opcional)
    * @param {number} y - posicion y del texto (opcional)
    * @param {number} maxWidth - ancho maximo que puede ocupar el texto (opcional)
    * @param {number} maxHeight - alto maximo que puede ocupar el texto (opcional)
    * @param {string} text - texto a mostrar (opcional)
    * @param {Phaser.Types.GameObjects.Text.TextStyle} style - estilo del texto (opcional)
    * @param {number} originX - origen x del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {number} originY - origen y del texto [0-1] (si esta alineado en el centro, se ignora) (opcional)
    * @param {number} paddingX - margen x entre el texto y sus dimensiones maximas (opcional)
    * @param {number} paddingY - margen y entre el texto y sus dimensiones maximas (opcional)
    * @param {number} offsetX - offset x del texto (opcional)
    * @param {number} offsetY - offset y del texto (opcional)
    * @param {number} alignX - alineacion horizontal del texto [0-1] (opcional)
    * @param {number} alignY - alineacion vertical del texto [0-1] (opcional)
    */

    private maxWidth: number
    private maxHeight: number

    private alignX: number
    private alignY: number

    private paddingX: number
    private paddingY: number

    private offsetX: number
    private offsetY: number

    private debugRect: GameObjects.Rectangle

    public constructor(scene: Scene, x: number = 0, y: number = 0, maxWidth: number = 100, maxHeight: number = 100, text: string = "", style: Phaser.Types.GameObjects.Text.TextStyle = {}, originX: number = 0.5, originY: number = 0.5, paddingX: number = 0, paddingY: number = 0, offsetX: number = 0, offsetY: number = 0, alignX: number = 0.5, alignY: number = 0.5) {
        // Se crea el texto y se anade a la escena
        super(scene, x, y, text, style);
        scene.add.existing(this);

        // Se calculan las dimensiones maximas en base a las indicadas y el padding
        this.maxWidth = maxWidth - paddingX * 2;
        this.maxHeight = maxHeight - paddingY * 2;

        // Se pone el texto en el origen indicado
        this.setOrigin(originX, originY);

        this.alignX = alignX;
        this.alignY = alignY;
        this.paddingX = paddingX;
        this.paddingY = paddingY;
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        this.setPosition(x, y);
    }

    /**
    * Comprueba si el texto indicado cabe los limites establecidos
    * @param {string} text - texto a mostrar
    * @returns {boolean} - true si el texto cabe, false en caso contrario
    */
    public fits(text: string) {
        let prevText = this.text;
        this.setText(text);
        let fits = true;

        // Si el texto no tiene ajuste de linea, cabe si tanto su ancho como su alto no exceden los limites
        if (this.style.wordWrapWidth == null) {
            fits = this.displayWidth <= this.maxWidth && this.displayHeight <= this.maxHeight;
        }
        // Si tiene ajuste de linea, cabe si su alto no excede los limites (independientemente del ancho)
        else {
            fits = this.displayHeight <= this.maxHeight;
        }
        this.setText(prevText);

        // if (!fits) {
        //     console.log(text, this.displayWidth, this.displayHeight, this.maxWidth, this.maxHeight);
        // }
        return fits;
    }


    /**
    * Ajusta automaticamente el tamano de la fuente hasta que quepa al menos 1 caracter
    * @param {string} text - primer caracter del texto a mostrar
    * @param {number} reduction - reduccion que se le ira aplicando a la fuente cada vez que se compruebe si cabe o no
    */
    public adjustFontSize(text: string = "", reduction: number = 5) {
        if (text == null || text == "") {
            text = this.text;
        }
        if (text != "") {
            let textConfig = this.style;
            let fontSize = textConfig.fontSize;
            if (typeof fontSize == "string") {
                fontSize = fontSizeToInt(fontSize);
            }

            let fontSizes = range(1, fontSize - 1, reduction);

            if (this.maxWidth > 0 && this.maxHeight > 0 && text != "" && !this.fits(text)) {
                let ini = 0;
                let end = fontSizes.length - 1;

                // Divide y venceras
                while (end - ini > 1) {
                    let half = Math.floor((end + ini) / 2);
                    this.setFontSize(fontSizes[half]);

                    if (this.fits(text)) {
                        ini = half;
                    }
                    else {
                        end = half;
                    }
                }

                this.setFontSize(fontSizes[ini]);
            }
        }
    }

    /**
    * Ajusta automaticamente el texto para que quepa dentro de los limites.
    * Si el texto excede el tamano, se recorta progresivamente hasta que encoja
    * 
    * @param {boolean} keepRight - Si es true, se recortan caracteres por la izquierda (se mantiene el final del texto).
    *                              Si es false, se recortan por la derecha (se mantiene el inicio del texto).
    * @param {string} - texto que se quiere ajustar. Si no se proporciona, se usara el texto actual.
    * @param {number} - cantidad de caracteres que se eliminan por iteracion (opcionaL9)
    */
    public adjustTextLength(keepRight: boolean, text: string = "", reduction: number = 1) {
        if (text == null || text == "") {
            text = this.text;
        }
        if (text != "") {
            while (this.maxWidth > 0 && this.maxHeight > 0 && text !== "" && !this.fits(text)) {
                if (keepRight) {
                    // Se elimina caracteres del inicio para mantener el final de texto
                    text = text.slice(reduction - text.length);
                }
                else {
                    // Se eliminan caracteres del final para mantener el inicio
                    text = text.slice(0, -reduction);
                }
                this.setText(text);
            }
        }
    }

    public setAreaSize(maxWidth: number, maxHeight: number) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;

        if (DEBUG) {
            this.debugRect.setSize(this.maxWidth, this.maxHeight);
        }
    }

    public setPosition(x?: number, y?: number, z?: number, w?: number) {
        super.setPosition(x, y, z, w);

        if (x === undefined) {
            x = 0;
        }
        if (y === undefined) {
            y = x;
        }

        // Se coloca el texto segun su alineacion y el padding
        this.x = x - this.maxWidth * (0.5 - this.alignX) + this.paddingX * (0.5 - this.alignX) * 2 + this.offsetX;
        this.y = y - this.maxHeight * (0.5 - this.alignY) + this.paddingY * (0.5 - this.alignY) * 2 + this.offsetY;

        if (DEBUG) {
            this.debugRect = this.scene.add.rectangle(this.x, this.y, this.maxWidth, this.maxHeight, 0xff, 0)
                .setOrigin(this.originX, this.originY);
            this.debugRect.setStrokeStyle(2, 0x00ff00);

            this.setInteractive();
            this.scene.input.enableDebug(this, 0x00ff00);
            this.disableInteractive();
        }
        return this;
    }

    public getFontSize() {
        return this.style.fontSize;
    }

    public getDisplayWidth(text: string) {
        const originalText = this.text;
        if (text == null || text === "") {
            text = originalText;
        }

        this.setText(text);
        const width = this.displayWidth;

        this.setText(originalText);

        return width;
    }

    public getLines() {
        const lines = this.getWrappedText();
        return lines;
    }

    public getTextSize() {
        const lines = this.getWrappedText();
        const metrics = this.getTextMetrics();
        const textSize = Phaser.GameObjects.GetTextSize(this, metrics, lines);
        return textSize;
    }
}