import { Scene, GameObjects, Input, Types } from "phaser";
import AnimatedContainer from "../animatedContainer";
import { growAnimation } from "../../utils/graphics";
import TextArea from "../textArea";
import TextInput from "../textInput";
import { completeMissingProperties } from "../../utils/misc";
import { DEBUG } from "../../../types/config";

export default class ThoughtBox extends AnimatedContainer {
    private textInput: TextInput
    private button: GameObjects.Image
    private enterKey: Input.Keyboard.Key
    private context: TextArea
    private headerTextArea: TextArea;
    private cloudHeight: number;
    private cloudWidth: number;
    private cloudContainer: AnimatedContainer
    private debugGraphics?: GameObjects.Graphics;

    public constructor(scene: Scene, cloudX: number, cloudY: number, headerText: string, headerTextStyle: Types.GameObjects.Text.TextStyle, contextTextStyle: Types.GameObjects.Text.TextStyle, defaultText: string, defaultTextStyle: Types.GameObjects.Text.TextStyle, inputTextStyle: Types.GameObjects.Text.TextStyle, onClick: Function) {
        super(scene, 0, 0);

        const canvasHeight = scene.sys.game.canvas.height;

        const dreamBg = scene.add.image(0, 0, 'dream');
        dreamBg.setOrigin(0);
        const scale = canvasHeight / dreamBg.height;
        dreamBg.setScale(scale);
        dreamBg.setAlpha(0.8);
        this.add(dreamBg)

        this.cloudContainer = new AnimatedContainer(scene, cloudX, cloudY);

        const cloud = scene.add.image(0, 0, "thoughtCloud");
        this.cloudContainer.add(cloud);

        if (DEBUG) {
            this.debugGraphics = scene.add.graphics();
        }

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

        this.cloudWidth = cloud.displayWidth - 455
        this.cloudHeight = cloud.displayHeight - 230

        const fixedInputTextStyle = completeMissingProperties(
            {
                wordWrap: {
                    width: this.cloudWidth,
                    useAdvancedWrap: false
                },
                lineSpacing: 9
            },
            inputTextStyle
        );

        const offsetX = -10;

        const fixedContextTextStyle = completeMissingProperties(
            {
                wordWrap: {
                    width: this.cloudWidth,
                    useAdvancedWrap: true
                },
                lineSpacing: 3
            },
            contextTextStyle
        );

        this.context = new TextArea(scene, -this.cloudWidth / 2, -this.cloudHeight / 2, this.cloudWidth, this.cloudHeight, "", fixedContextTextStyle, 0, 0, 0, 0, offsetX, 0, 0.5, 0.5)
        if (DEBUG) {
            this.cloudContainer.add(this.context.debugRect)
        }
        this.cloudContainer.add(this.context);

        this.headerTextArea = new TextArea(scene, this.context.x, 0, this.cloudWidth, this.cloudHeight, headerText, headerTextStyle, 0, 0, 0, 0, 0, 0, 0.5, 0.5)
        this.headerTextArea.adjustFontSize();
        if (DEBUG) {
            this.cloudContainer.add(this.headerTextArea.debugRect)
        }
        this.cloudContainer.add(this.headerTextArea);

        this.textInput = new TextInput(scene, offsetX, 0, this.cloudWidth, 0, defaultText, defaultTextStyle, fixedInputTextStyle, false, 0.5, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        this.cloudContainer.add(this.textInput);

        this.button = scene.add.image(173, 0, 'introIcon');
        this.button.setScale(0.26);
        
        const buttonScale = this.button.scale;

        growAnimation(this.button, [this.button], () => {
            this.handleOnClick(onClick, buttonScale);
        }, false, false, 1.2, 0)

        this.cloudContainer.add(this.button);

        this.updateLayout(false);

        this.add(this.cloudContainer);

        this.cloudContainer.setContainerOrigin(0.5, 1);

        const keyboard = this.scene.input.keyboard;
        if (keyboard) {
            this.enterKey = keyboard.addKey(
                Phaser.Input.Keyboard.KeyCodes.ENTER
            );

            keyboard.off('keydown-ENTER');

            this.enterKey.on('down', () => {
                this.handleOnClick(onClick, buttonScale);
            })
        }
    }

    private updateLayout(paint: boolean) {
        this.headerTextArea.y = this.context.y + this.context.displayHeight + 15;

        this.textInput.y = this.headerTextArea.y + this.headerTextArea.displayHeight + 10;

        const cloudMatrix = this.cloudContainer.getWorldTransformMatrix();

        const headerBottomY = cloudMatrix.transformPoint(0, this.headerTextArea.y).y + this.headerTextArea.displayHeight;

        const cloudBottomY = this.cloudContainer.y - this.cloudHeight / 1.7;

        if (this.debugGraphics) {
            this.debugGraphics.clear();

            if (paint) {
                this.debugGraphics.lineStyle(2, 0xff0000, 1);
                this.debugGraphics.lineBetween(0, headerBottomY, this.scene.scale.width, headerBottomY);

                this.debugGraphics.lineStyle(2, 0xff0000, 1);
                this.debugGraphics.lineBetween(0, cloudBottomY, this.scene.scale.width, cloudBottomY);
            }
        }

        const remainingHeight = cloudBottomY - headerBottomY;

        this.textInput.resize(this.cloudWidth, remainingHeight);

        this.button.y = this.textInput.y + this.textInput.displayHeight + 40;
    }

    private handleOnClick(onClick: Function, buttonScale: number) {
        if (onClick != undefined && typeof onClick == "function" && this.textInput.containsText()) {
            onClick();
            this.button.setScale(buttonScale);
        }
    }

    public getText() {
        return this.textInput.getText();
    }

    public activateInput(active: boolean) {
        this.textInput.activateInput(active);
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

    public setContextText(text: string, reduction: number = 1) {
        this.context.setText(text);
        this.context.adjustFontSize(text, reduction);
        this.updateLayout(true);
    }
}