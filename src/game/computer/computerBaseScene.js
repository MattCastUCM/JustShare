import BaseScene from '../scenes/gameLoop/baseScene.js';
import Button from '../UI/button.js'
import TextInput from '../UI/textInput.js'

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
            this.colors[key][HEX]['getNumberSign'] = value
            this.colors[key][HEX]["get0x"] = value.replace('#', '0x')
            this.colors[key][RGB] = this.gameManager.hexToRgb(value)
        }
                
        this.style = { ...this.gameManager.textConfig };
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

    translate(transId, options) {
        let namespaceObj = { ns: this.namespace }
        let optionsAux = { ...namespaceObj, ...options}

        return this.gameManager.translate(transId, optionsAux)
    }

    translateWithNamespace(transId, namespace, options) {
        namespace = namespace.replace(/\//g, '\\');
        let namespaceObj = { ns: namespace }
        let optionsAux = { ...namespaceObj, ...options}

        return this.gameManager.translate(transId, optionsAux)
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

    createButton(x, y, transId, onClick, scale = 1) {
        const FIGURE = this.gameManager.textBox
        
        let translation = this.translate(transId)

        let button = new Button(this, x, y, scale, onClick,
            FIGURE.fill.name, 
            this.colors.blue1.rgb, this.colors.blue2.rgb, this.colors.blue3.rgb,
            translation, 
            { font: this.fontFamilies.normal, size: 54, style: 'bold', color: this.colors.white.hex.getNumberSign }, 
            FIGURE.edge.name,
            {
                // La textura generada con el objeto grafico es un pelin mas grande que el dibujo en si. Por lo tanto,
                // si la caja de colision por defecto es un pelin mas grande. Es por eso que se pasa una que se ajuste
                // a las medidas reales
                area: new Phaser.Geom.Rectangle(FIGURE.offset, FIGURE.offset, FIGURE.width, FIGURE.height),
                callback: Phaser.Geom.Rectangle.Contains
            }
        );

        button.setSize(FIGURE.width * scale, FIGURE.height * scale)

        return button
    }

    createTextInput(x, y, transId, scale = 1, writeLocked = false) {
        const TEXT_INPUT_OFFSET = 23;
        const FIGURE = this.gameManager.inputBox
        
        let translation = this.translate(transId)

        let textInput = new TextInput(this, x, y, scale, translation, TEXT_INPUT_OFFSET, this.colors.blue0.rgb,
            FIGURE.fill.name, FIGURE.edge.name, this.fontFamilies.normal,
            {
                area: new Phaser.Geom.Rectangle(FIGURE.offset, FIGURE.offset, FIGURE.width, FIGURE.height),
                callback: Phaser.Geom.Rectangle.Contains
            }, writeLocked);

        // Propiedades
        textInput.setSize(FIGURE.width, FIGURE.height)
        
        return textInput;
    }

    createTextInputWithSideText(x, y, transId, scale = 1, writeLocked = false) {
        const TEXT_OFFSET_X = -10;
        
        let container = this.add.container(x, y);

        // Texto a la izquierda
        this.addSideText(container, TEXT_OFFSET_X, transId)

        // Text input
        let textInput = this.createTextInput(0, 0, transId, 1, writeLocked)
        container.add(textInput)

        container.setScale(scale)
        
        // Propiedaes
        container.setSize(textInput.width * scale, textInput.height * scale)
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

        nCol = Phaser.Display.Color.GetColor(nCol.R, nCol.G, nCol.B);
        nCol = Phaser.Display.Color.IntegerToRGB(nCol);

        hCol = Phaser.Display.Color.GetColor(hCol.R, hCol.G, hCol.B);
        hCol = Phaser.Display.Color.IntegerToRGB(hCol);

        pCol = Phaser.Display.Color.GetColor(pCol.R, pCol.G, pCol.B);
        pCol = Phaser.Display.Color.IntegerToRGB(pCol);

        animTarget.setTint(Phaser.Display.Color.GetColor(nCol.r, nCol.g, nCol.b));

        hitTarget.setInteractive({ useHandCursor: true });

        hitTarget.on('pointerover', () => {
            this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(nCol, hCol, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
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
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(hCol, nCol, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
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
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(hCol, pCol, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
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
            
        nCol = Phaser.Display.Color.GetColor(nCol.R, nCol.G, nCol.B);
        nCol = Phaser.Display.Color.IntegerToRGB(nCol);
        
        hCol = Phaser.Display.Color.GetColor(hCol.R, hCol.G, hCol.B);
        hCol = Phaser.Display.Color.IntegerToRGB(hCol);
        
        pCol = Phaser.Display.Color.GetColor(pCol.R, pCol.G, pCol.B);
        pCol = Phaser.Display.Color.IntegerToRGB(pCol);
        
        animTarget.setTint(Phaser.Display.Color.GetColor(nCol.r, nCol.g, nCol.b));

        const TINT_FADE_DURATION = 25;
        hitTarget.on('pointerover', () => {
            this.tweens.addCounter({
                targets: [animTarget],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(nCol, hCol, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
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
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(hCol, pCol, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                    animTarget.setTint(colInt);
                },
                duration: TINT_FADE_DURATION,
                repeat: 0,
                yoyo: true,
            });
            anim.on('complete', () => {
                animTarget.setTint(Phaser.Display.Color.GetColor(nCol.r, nCol.g, nCol.b));
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
                let col = Phaser.Display.Color.Interpolate.ColorWithColor(hCol, nCol, 100, value);
                let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
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
        hitTarget.restartInteractionAnim = function() {
            this.interactionAnim.restart()
            this.setInteractive({ useHandCursor: true });
        }
    }

    ///////////////////////////////////////
    ////// Metodos para animar texto //////
    //////////////////////////////////////

    changeText(target, duration, transId, transParams) {
        let translation = this.translate(transId, transParams)

        // Si esta invisible
        if(target.alpha <= 0) {
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
            if(target.text != translation) {
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
        if(target.alpha <= 0) {
            this.tweens.add({
                targets: target,
                alpha: 1,
                duration: duration,
                repeat: 0,
            });
        }
    }

    makeTextDisappear(target, duration) {
        if(target.alpha > 0) {
            this.tweens.add({
                targets: target,
                alpha: 0,
                duration: duration,
                repeat: 0,
            });
        }
    }
}