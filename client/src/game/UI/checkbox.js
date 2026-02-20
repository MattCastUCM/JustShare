import { Scene, GameObjects, Display } from "phaser";
const { GetColor, IntegerToRGB, HexStringToColor } = Display.Color;
const { ColorWithColor } = Display.Color.Interpolate
import GameManager from "../managers/gameManager";
import { TEXT_CONFIG } from "../utils/graphics";
import { DEBUG } from "../../types/config";
import { setInteractive } from "../utils/misc";

export default class CheckBox extends GameObjects.Container {
    /**
    * Clase que permite crear una checkbox o radiobutons si se unen varias checkboxes en un grupo
    * @param {Scene} scene - escena a la que pertenece
    * @param {number} x - posicion x
    * @param {number} y - posicion y
    * @param {Color} pressedCol - color RGB de la checkbox que se utiliza en la animacion cuando se clica en ella
    * @param {string} fill - sprite que se usa para el relleno
    */
    constructor(scene, x, y, pressedColor, fill, style = {}) {
        super(scene, x, y);

        this.scene.add.existing(this);

        let gameManager = GameManager.getInstance();

        // Indicar si la checkbox esta activada o no
        this.checked = false;

        // Si es distinto de null pertenece a algun grupo y funciona como un radio button
        this.group = null;

        this.nCol = HexStringToColor('#ffffff');
        this.pCol = GetColor(pressedColor.R, pressedColor.G, pressedColor.B);
        this.pCol = IntegerToRGB(this.pCol);

        this.fillImg = this.scene.add.image(0, 0, fill);
        this.add(this.fillImg);
        this.addHitArea(this.fillImg)

        this.tickText = this.scene.add.text(0, 0, '✓', style).setOrigin(0.5).setVisible(false);
        this.add(this.tickText);
    }

    addHitArea(hitArea) {
        setInteractive(hitArea);

        if (DEBUG) {
            this.scene.input.enableDebug(hitArea, 0x00ff00);
        }

        hitArea.on('pointerdown', () => {
            let down = this.scene.tweens.addCounter({
                targets: this.fillImg,
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(this.nCol, this.pCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    this.fillImg.setTint(colInt);
                },
                duration: 80,
                repeat: 0,
                yoyo: true
            });
            down.on('complete', () => {
                if (this.group) {
                    // Si funciona como un radio button, se desactiva el resto del gruop
                    this.group.checkButton(this);
                    this.setChecked(true);
                }
                // Si funciona simplemente como una checkbox, se hace toggle
                else {
                    this.toggleChecked();
                }
            });
        });
    }

    setChecked(checked) {
        this.checked = checked;
        this.tickText.setVisible(this.checked);
    }

    toggleChecked() {
        this.checked = !this.checked;
        this.tickText.setVisible(this.checked);
    }

    setGroup(group) {
        if (!this.group) {
            this.group = group;
        }
    }
}