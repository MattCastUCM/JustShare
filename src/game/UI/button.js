import { Scene, GameObjects, Display } from "phaser"
const { GetColor, IntegerToRGB } = Display.Color;
const { ColorWithColor } = Display.Color.Interpolate
import GameManager from "../managers/gameManager";

export default class Button extends GameObjects.Container {
    /**
    * Clase que permite crear un boton personalizable con animaciones para las diferentes interacciones
    * @param {Scene} scene - escena a la que pertenece
    * @param {Number} x - posicion x
    * @param {Number} y - posicion y
    * @param {Number} scale - escala del objeto
    * @param {Function} onClick - funcion que se ejecuta cuando se clica en el boton
    * @param {String} fill - sprite que se usa para el relleno
    * @param {Color} normalCol - color RGB del boton cuando no se esta interactuando con el
    * @param {Color} highlightedCol - color RGB cuando se pasa el puntero por encima
    * @param {Color} pressedCol - color RGB del boton cuando se clica en el
    * @param {Text} text - texto que se escribe en el boton (opcional)
    * @param {Object} fontParams - distintos parametros (tipografia, tam, estilo, color) para personalizar el texto anterior (opcional)
    * @param {String} edge - sprite que se usa para el borde (opcional)
    * @param {String} hitArea - cambiar el area de colision (opcional)
    */
    constructor(scene, x, y, scale, onClick, fill, normalCol, highlightedCol, pressedCol, text, fontParams, edge, hitArea) {
        super(scene, x, y);
        this.scene.add.existing(this);

        let gameManager = GameManager.getInstance();

        // La imagen pertenece a una atlas
        if (fill.hasOwnProperty('atlas')) {
            this.fillImg = this.scene.add.image(0, 0, fill.atlas, fill.frame);
        }
        // La imagen es independiente
        else {
            this.fillImg = this.scene.add.image(0, 0, fill);
        }

        this.nCol = GetColor(normalCol.R, normalCol.G, normalCol.B);
        this.nCol = IntegerToRGB(this.nCol);
        this.hCol = GetColor(highlightedCol.R, highlightedCol.G, highlightedCol.B);
        this.hCol = IntegerToRGB(this.hCol);
        this.pCol = GetColor(pressedCol.R, pressedCol.G, pressedCol.B);
        this.pCol = IntegerToRGB(this.pCol);

        this.fillImg.setTint(GetColor(this.nCol.r, this.nCol.g, this.nCol.b));

        this.hitArea = null;
        if (hitArea) {
            this.hitArea = hitArea;
            this.fillImg.setInteractive(hitArea.area, hitArea.callback, { useHandCursor: true });
        }
        else {
            this.fillImg.setInteractive({ useHandCursor: true });
        }

        // Dibujar el area de colision
        let debug = this.scene.sys.game.debug;
        if (debug.enable) {
            this.scene.input.enableDebug(this.fillImg, debug.color);
        }

        const TINT_FADE_TIME = 25;

        this.fillImg.on('pointerover', () => {
            scene.tweens.addCounter({
                targets: [this.fillImg],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(this.nCol, this.hCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: TINT_FADE_TIME,
                repeat: 0,
            });
        });

        this.fillImg.on('pointerout', () => {
            scene.tweens.addCounter({
                targets: [this.fillImg],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(this.hCol, this.nCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: TINT_FADE_TIME,
                repeat: 0,
            });
        });

        this.fillImg.on('pointerdown', () => {
            this.fillImg.disableInteractive();
            let down = scene.tweens.addCounter({
                targets: [this.fillImg],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(this.hCol, this.pCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: TINT_FADE_TIME,
                repeat: 0,
                yoyo: true,
            });
            down.on('complete', () => {
                this.fillImg.setInteractive({ useHandCursor: true });
                if (!gameManager.isInFadeAnimation()) {
                    onClick();
                }
            });
        });

        this.add(this.fillImg);

        if (edge) {
            let edgeImg = this.scene.add.image(0, 0, edge);
            this.add(edgeImg);
        }

        if (text) {
            let style = { ...gameManager.textConfig };
            style.fontFamily = fontParams.font;
            style.fontSize = fontParams.size + 'px';
            style.fontStyle = fontParams.style;
            style.color = fontParams.color;

            let buttonText = this.scene.add.text(0, 0, text, style);
            buttonText.setOrigin(0.5);
            this.add(buttonText);
        }

        this.setScale(scale);
    }

    setHitArea(hitArea) {
        this.fillImg.removeInteractive();
        this.hitArea = hitArea;
        this.fillImg.setInteractive(hitArea.area, hitArea.callback, { useHandCursor: true });

        let debug = this.scene.sys.game.debug;
        if (debug.enable) {
            this.scene.input.enableDebug(this.fillImg, debug.color);
        }
    }

    reset() {
        this.fillImg.setTint(GetColor(this.nCol.r, this.nCol.g, this.nCol.b));
    }
}