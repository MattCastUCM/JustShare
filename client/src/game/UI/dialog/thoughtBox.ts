import { Scene, GameObjects, Input, Types } from "phaser";
import AnimatedContainer from "../animatedContainer";
import { growAnimation } from "../../utils/graphics";
import TextArea from "../textArea";
import TextInput from "../textInput";
import { completeMissingProperties } from "../../utils/misc";

export default class ThoughtBox extends AnimatedContainer {
    private textInput: TextInput
    private button: GameObjects.Image
    private enterKey: Input.Keyboard.Key

    public constructor(scene: Scene, cloudX: number, cloudY: number, headerText: string, defaultText: string, headerTextStyle: Types.GameObjects.Text.TextStyle, defaultTextStyle: Types.GameObjects.Text.TextStyle, inputTextStyle: Types.GameObjects.Text.TextStyle, onClick: Function) {
        super(scene, 0, 0);

        const canvasHeight = scene.sys.game.canvas.height;

        const dreamBg = scene.add.image(0, 0, 'dream');
        dreamBg.setOrigin(0);
        const scale = canvasHeight / dreamBg.height;
        dreamBg.setScale(scale);
        dreamBg.setAlpha(0.8);
        this.add(dreamBg)

        const cloudContainer = new AnimatedContainer(scene, cloudX, cloudY);

        const cloud = scene.add.image(0, 0, "thoughtCloud");
        cloud.setAlpha(0.8);
        cloudContainer.add(cloud);

        const glowColor = Phaser.Display.Color.GetColor(220, 220, 220);
        const fx = cloud.postFX.addGlow(glowColor, 0, 0, false, 0.05, 20);
        scene.tweens.add({
            targets: fx,
            outerStrength: { from: 0, to: 1 },
            yoyo: true,
            loop: -1,
            ease: 'sine.inOut',
            duration: 3000,
        });

        const textY = 120
        const textWidth = cloud.displayWidth - 220;

        const defaultObj = {
            wordWrap: {
                width: textWidth,
                useAdvancedWrap: false
            }
        }
        const fixedHeaderTextStyle = completeMissingProperties(defaultObj, headerTextStyle);
        const fixedDefaultTextStyle = completeMissingProperties(defaultObj, defaultTextStyle);
        const fixedInputTextStyle = completeMissingProperties(defaultObj, inputTextStyle);

        // const style: Phaser.Types.GameObjects.Text.TextStyle = { ...TEXT_CONFIG }
        // style.fontFamily = "roboto-regular"
        // style.color = '#2e2e2e'
        // style.fontSize = 40;

        // const textStyle = { ...style }
        // textStyle.fontStyle = "bold";

        const textArea = new TextArea(scene, 0, textY, textWidth, cloud.displayHeight, headerText, fixedHeaderTextStyle, 0, 0, 0, 0, 0, 0, 0, 0)
        textArea.adjustFontSize();
        cloudContainer.add(textArea);

        // const inputStyle = { ...style }
        // inputStyle.fontSize = 37;
        // style.wordWrap = {
        //     width: textWidth,
        //     useAdvancedWrap: false
        // }

        // const defaultStyle = { ...inputStyle }
        // defaultStyle.fontStyle = "italic";

        this.textInput = new TextInput(scene, 0, textY - cloud.displayHeight / 2 + textArea.displayHeight / 2 + 45, textWidth, cloud.displayHeight - 320, defaultText, fixedDefaultTextStyle, fixedInputTextStyle, false, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        cloudContainer.add(this.textInput);

        this.button = scene.add.image(235, this.textInput.y + this.textInput.height + 50, 'introIcon');
        this.button.setScale(0.27);

        growAnimation(this.button, [this.button], () => {
            this.handleOnClick(onClick);
        }, false, false, 1.2, 0)

        cloudContainer.add(this.button);
        this.add(cloudContainer);

        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            this.enterKey = keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            );
            // keyEnter.enabled = false;

            keyboard.off('keydown-ENTER');

            this.enterKey.on('down', () => {
                this.handleOnClick(onClick);
            })
        }
    }


    handleOnClick(onClick: Function) {
        if (onClick != undefined && typeof onClick == "function" && this.textInput.containsText()) {
            onClick();
        }
    }

    getText() {
        return this.textInput.getText();
    }

    activateInput(active: boolean) {
        this.textInput.activateInput(active);
        this.enterKey.enabled = active;
        if (active) {
            this.button.setInteractive();
        }
        else {
            this.button.disableInteractive();
        }
    }

    clearText() {
        this.textInput.clear();
    }

    ensureWordWrap(style: Types.GameObjects.Text.TextStyle, width: number) {
        if (!style.wordWrap) {
            style.wordWrap = {};
        }

        if (!style.wordWrap.width === undefined) {
            style.wordWrap.width = width;
        }

        if (style.wordWrap.useAdvancedWrap === undefined) {
            style.wordWrap.useAdvancedWrap = false;
        }

        return style;
    }
}