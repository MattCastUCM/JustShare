import { Scene, GameObjects, Input, Types } from "phaser";
import AnimatedContainer from "../animatedContainer";
import { growAnimation } from "../../utils/graphics";
import TextArea from "../textArea";
import TextInput from "../textInput";
import { completeMissingProperties } from "../../utils/misc";
import { DEBUG } from "../../../types/misc";

export default class ThoughtBox extends AnimatedContainer {
    private textInput: TextInput
    private button: GameObjects.Image
    private enterKey: Input.Keyboard.Key
    private summaryTextArea: TextArea

    public constructor(scene: Scene, cloudX: number, cloudY: number, headerText: string, summaryTextStyle: Types.GameObjects.Text.TextStyle, headerTextStyle: Types.GameObjects.Text.TextStyle, inputTextStyle: Types.GameObjects.Text.TextStyle, onClick: Function) {
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

        const width = cloud.displayWidth - 455
        const height = cloud.displayHeight - 220

        const defaultObj = {
            wordWrap: {
                width: width,
                useAdvancedWrap: false
            },
            lineSpacing: 9
        }
        const fixedInputTextStyle = completeMissingProperties(defaultObj, inputTextStyle);

        const offsetX = -10;

        this.summaryTextArea = new TextArea(scene, -width / 2, -height / 2, width, height, "", summaryTextStyle, 0, 0, 0, 0, offsetX, 0, 0.5, 0.5)
        // summaryTextArea.adjustFontSize();
        console.log(this.summaryTextArea.y);
        if (DEBUG) {
            cloudContainer.add(this.summaryTextArea.debugRect)
        }
        cloudContainer.add(this.summaryTextArea);

        const y = this.summaryTextArea.y + this.summaryTextArea.displayHeight + 30;

        const headerTextArea = new TextArea(scene, this.summaryTextArea.x, y, width, height, headerText, headerTextStyle, 0, 0, 0, 0, 0, 0, 0.5, 0.5)
        headerTextArea.adjustFontSize();
        console.log(headerTextArea.y);
        if (DEBUG) {
            cloudContainer.add(headerTextArea.debugRect)
        }
        cloudContainer.add(headerTextArea);

        this.textInput = new TextInput(scene, offsetX, -height / 2 - y + 63, width, 110, "", fixedInputTextStyle, fixedInputTextStyle, false, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        cloudContainer.add(this.textInput);

        this.button = scene.add.image(173, this.textInput.y + this.textInput.displayHeight + 40, 'introIcon');
        this.button.setScale(0.26);

        growAnimation(this.button, [this.button], () => {
            this.handleOnClick(onClick);
        }, false, false, 1.2, 0)

        cloudContainer.add(this.button);
        this.add(cloudContainer);

        cloudContainer.setContainerOrigin(0.5, 1);

        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            this.enterKey = keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            );

            keyboard.off('keydown-ENTER');

            this.enterKey.on('down', () => {
                this.handleOnClick(onClick);
            })
        }
    }


    private handleOnClick(onClick: Function) {
        if (onClick != undefined && typeof onClick == "function" && this.textInput.containsText()) {
            onClick();
        }
    }

    public getText() {
        return this.textInput.getText();
    }

    public activateInput(active: boolean) {
        // this.textInput.activateInput(active);
        this.enterKey.enabled = active;
        if (active) {
            this.button.setInteractive();
        }
        else {
            this.button.disableInteractive();
        }
    }

    public clearText() {
        this.textInput.clear();
    }

    public setSummaryText(text: string) {
        this.summaryTextArea.setText(text);
    }
}