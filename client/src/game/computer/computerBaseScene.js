import { Scene, Display, Geom } from "phaser";
const { GetColor, IntegerToRGB } = Display.Color;
const { ColorWithColor } = Display.Color.Interpolate;
import BaseScene from '../scenes/gameLoop/baseScene';
import Button from '../UI/button'
import TextInput from '../UI/textInput'
import { createRectTexture, hexToRgb, TEXT_CONFIG } from "../utils/graphics";

export default class ComputerBaseScene extends BaseScene {
    constructor(name) {
        super(name, null);
    }

    create(params) {
        super.create(params)

        this.fontFamilies = {
            normal: 'corpid',
            bold: 'corpid-black'
        }

        let colorsAux = {
            black: '#000000',
            white: '#FFFFFF',
            grey0: '#e6e6e6',
            grey1: '#cdcdcd',
            blue0: '#bec0e6',
            blue1: '#9c9edf',
            blue2: '#7274b3',
            blue3: '#5E606B',
            orange: '#FD6414'
        }

        this.colors = {}

        const HEX = "hex"
        const RGB = "rgb"

        for (const [key, value] of Object.entries(colorsAux)) {
            this.colors[key] = {}
            this.colors[key][HEX] = {}
            this.colors[key][HEX]['getNumberSign'] = value;
            this.colors[key][HEX]["get0x"] = value.replace('#', '0x');
            this.colors[key][RGB] = hexToRgb(value);
        }

        this.style = { ...TEXT_CONFIG };
        this.style.fontFamily = this.fontFamilies.normal
        this.style.fontSize = '50px';
        this.style.color = this.colors.black.hex.getNumberSign
    }

    createPowerIcon(onClick) {
        const POS_X = 265;
        const POS_Y = 760;
        const SCALE = 0.13;

        let powerIcon = this.add.image(POS_X, POS_Y, 'powerIcon');
        powerIcon.setScale(SCALE)
        powerIcon.setTintFill(0xffffff);

        this.turnIntoButtonSizeAnim(powerIcon, powerIcon, onClick)

        return powerIcon
    }

    ///////////////////////////////////////
    //////// Metodos de utilidad /////////
    //////////////////////////////////////
    createBackground(bg) {
        let bgImage = this.add.image(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, bg);
        let scale = this.CANVAS_WIDTH / bgImage.width;
        bgImage.setScale(scale);
        return bgImage
    }

    setNamespace(namespace) {
        this.namespace = namespace.replace(/\//g, '\\');
    }

    translate(transId, options = {}) {
        return this.translatorManager.translate(transId, this.namespace, options)
    }

    translateWithNamespace(transId, namespace, options = {}) {
        namespace = namespace.replace(/\//g, '\\');
        return this.translatorManager.translate(transId, namespace, options)
    }

    clamp(value, min, max) {
        value = Math.max(value, min)
        value = Math.min(max, value)
        return value
    }

    getRandomInt(minIncluded, maxIncluded) {
        // Math.random() -> genera valores entre 0 y 0,999...
        return Math.floor(Math.random() * (maxIncluded - minIncluded + 1) + minIncluded);
    }

    ///////////////////////////////////////
    ///// Metodos para crear objetos //////
    //////////////////////////////////////

    addSideText(container, x, transId) {
        const MAX_N_CHARACTERES = 10 + 1
        const SIZE_REDUCTION = 0.15

        let translation = this.translate(transId)

        let style = { ...this.style }
        let size = parseInt(style.fontSize.slice(0, -2))

        let reductionAmount = (1 - Math.floor(translation.length / MAX_N_CHARACTERES) * SIZE_REDUCTION)
        reductionAmount = this.clamp(reductionAmount, SIZE_REDUCTION, 1)

        size = size * reductionAmount
        style.fontSize = size + 'px'

        let sideText = this.add.text(x, 0, translation, style);
        sideText.setOrigin(1, 0.5);

        container.add(sideText);
    }

    createButton(x, y, sprite, transId, onClick, style) {
        const translation = this.translate(transId);

        let button = new Button(this, x, y, onClick, sprite, this.colors.blue1.rgb, this.colors.blue2.rgb, this.colors.blue3.rgb, translation, style);

        return button;
    }

    createTextInput(x, y, sprite, transId, style, writeLocked = false) {
        const TEXT_INPUT_OFFSET = 23;

        let translation = this.translate(transId);

        let textInput = new TextInput(this, x, y, translation, TEXT_INPUT_OFFSET, this.colors.blue0.rgb, sprite, style, writeLocked);

        return textInput;
    }

    createTextInputWithSideText(x, y, sprite, transId, style, writeLocked = false) {
        const TEXT_OFFSET_X = -10;

        let container = this.add.container(x, y);

        // Texto a la izquierda
        this.addSideText(container, TEXT_OFFSET_X, transId)

        // Text input
        let textInput = this.createTextInput(0, 0, sprite, transId, style, writeLocked)
        container.add(textInput)

        // Propiedaes
        container.setSize(textInput.width, textInput.height)
        container.textInput = textInput

        return container
    }

    ///////////////////////////////////////////
    /// Metodos para convertir en botones ////
    //////////////////////////////////////////

    turnIntoButtonSizeAnim(animTarget, hitTarget, onClick) {
        const SCALE_MULTIPLIER = 1.2;
        let originalScale = animTarget.scale

        hitTarget.setInteractive({ useHandCursor: true });

        hitTarget.on('pointerover', () => {
            this.tweens.add({
                targets: animTarget,
                scale: originalScale * SCALE_MULTIPLIER,
                duration: 0,
                repeat: 0,
            });
        }
        );

        hitTarget.on('pointerout', () => {
            this.tweens.add({
                targets: animTarget,
                scale: originalScale,
                duration: 0,
                repeat: 0,
            });

        });

        hitTarget.on('pointerdown', () => {
            hitTarget.disableInteractive();
            let anim = this.tweens.add({
                targets: animTarget,
                scale: originalScale,
                duration: 20,
                repeat: 0,
                yoyo: true
            });
            anim.on('complete', () => {
                hitTarget.setInteractive({ useHandCursor: true });
                onClick()
            });
        });
    }

    turnIntoButtonColorAnim(animTarget, hitTarget, onClick,
        nCol = this.colors.white.rgb, hCol = this.colors.grey0.rgb, pCol = this.colors.grey1.rgb) {
        const TINT_FADE_DURATION = 25;

        nCol = GetColor(nCol.R, nCol.G, nCol.B);
        nCol = IntegerToRGB(nCol);

        hCol = GetColor(hCol.R, hCol.G, hCol.B);
        hCol = IntegerToRGB(hCol);

        pCol = GetColor(pCol.R, pCol.G, pCol.B);
        pCol = IntegerToRGB(pCol);

        animTarget.setTint(GetColor(nCol.r, nCol.g, nCol.b));

        hitTarget.setInteractive({ useHandCursor: true });

        hitTarget.on('pointerover', () => {
            this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(nCol, hCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
            });
        });

        hitTarget.on('pointerout', () => {
            this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(hCol, nCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
            });
        });

        hitTarget.on('pointerdown', () => {
            hitTarget.disableInteractive();
            let anim = this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(hCol, pCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
                yoyo: true,
            });
            anim.on('complete', () => {
                hitTarget.setInteractive({ useHandCursor: true });
                onClick();
            });
        });
    }

    turnIntoButtonInteractionAnim(animTarget, hitTarget, onClick,
        nCol = this.colors.white.rgb, hCol = this.colors.grey0.rgb, pCol = this.colors.grey1.rgb) {

        nCol = GetColor(nCol.R, nCol.G, nCol.B);
        nCol = IntegerToRGB(nCol);

        hCol = GetColor(hCol.R, hCol.G, hCol.B);
        hCol = IntegerToRGB(hCol);

        pCol = GetColor(pCol.R, pCol.G, pCol.B);
        pCol = IntegerToRGB(pCol);

        animTarget.setTint(GetColor(nCol.r, nCol.g, nCol.b));

        const TINT_FADE_DURATION = 25;
        hitTarget.on('pointerover', () => {
            this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(nCol, hCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
            });
        });

        hitTarget.on('pointerdown', () => {
            let anim = this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = ColorWithColor(hCol, pCol, 100, value);
                    let colInt = GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
                yoyo: true,
            });
            anim.on('complete', () => {
                animTarget.setTint(GetColor(nCol.r, nCol.g, nCol.b));
                onClick();
            });
        });

        this.addButtonInteractionAnim(animTarget, hitTarget, nCol, hCol)
    }

    addButtonInteractionAnim(animTarget, hitTarget, nCol, hCol) {
        const DURATION = 650

        let interactionAnim = this.tweens.addCounter({
            targets: [animTarget],
            from: 0,
            to: 100,
            onUpdate: (tween) => {
                const value = tween.getValue();
                let col = ColorWithColor(hCol, nCol, 100, value);
                let colInt = GetColor(col.r, col.g, col.b);
                animTarget.setTint(colInt);
            },
            duration: DURATION,
            repeat: -1,
            yoyo: true,
            paused: true
        })

        hitTarget.on('pointerover', () => {
            interactionAnim.pause()
        });

        hitTarget.on('pointerdown', () => {
            interactionAnim.pause()
            hitTarget.disableInteractive()
        });

        hitTarget.on('pointerout', () => {
            interactionAnim.resume()
        })

        // Propiedades
        hitTarget.interactionAnim = interactionAnim
        hitTarget.restartInteractionAnim = function () {
            this.interactionAnim.restart()
            this.setInteractive({ useHandCursor: true });
        }
    }

    ///////////////////////////////////////
    ////// Metodos para animar texto //////
    //////////////////////////////////////

    changeText(target, duration, transId, options) {
        let translation = this.translate(transId, options)

        // Si esta invisible
        if (target.alpha <= 0) {
            // Se cambia
            target.setText(translation)

            // Fade in
            this.tweens.add({
                targets: target,
                alpha: 1,
                duration: duration,
                repeat: 0,
            });
        }
        // Si esta visible
        else {
            // Si el nuevo texto es diferente
            if (target.text != translation) {
                // Fade out
                let fadeOut = this.tweens.add({
                    targets: target,
                    alpha: 0,
                    duration: duration,
                    repeat: 0,
                });
                fadeOut.on('complete', () => {
                    // Se cambia el texto
                    target.setText(translation);
                    // Luego, fade in
                    this.tweens.add({
                        targets: target,
                        alpha: 1,
                        duration: duration,
                        repeat: 0,
                    });
                });
            }
        }
    }

    makeTextAppear(target, duration) {
        if (target.alpha <= 0) {
            this.tweens.add({
                targets: target,
                alpha: 1,
                duration: duration,
                repeat: 0,
            });
        }
    }

    makeTextDisappear(target, duration) {
        if (target.alpha > 0) {
            this.tweens.add({
                targets: target,
                alpha: 0,
                duration: duration,
                repeat: 0,
            });
        }
    }
}