import { createRectTexture, TEXT_CONFIG } from "../utils/graphics";
import BaseScreen from "./baseScreen";

export default class LoginScreen extends BaseScreen {
    constructor(scene) {
        super(scene, 'loginScreen');

        const X = this.CANVAS_WIDTH / 3;
        const Y = 2.8 * this.CANVAS_HEIGHT / 7;
        const SCALE = 0.78

        const OFFSET_X = 80
        const OFFSET_Y = 40;

        let container = this.scene.add.container(X, Y)
        this.add(container)

        const textInputSprite = "loginScreenInput"
        createRectTexture(this.scene, textInputSprite, 335, 90, 0xffffff, 1, 2.5, 0x000000, 1, 20)
        
        const textInputStyle = { ...TEXT_CONFIG };
        textInputStyle.fontFamily = this.scene.fontFamilies.normal;
        textInputStyle.fontSize = '42px';
        textInputStyle.color = '#000000';

        let nameInput = this.scene.createTextInputWithSideText(OFFSET_X, 0, textInputSprite, "usernameInput", textInputStyle, true)
        nameInput.textInput.addText(this.username);
        container.add(nameInput);

        let passwordInput = this.scene.createTextInputWithSideText(nameInput.x, nameInput.y + nameInput.height + OFFSET_Y, textInputSprite, "passwordInput", textInputStyle, true)
        passwordInput.textInput.addText("**********");
        container.add(passwordInput);

        const buttonSprite = "loginScreenButton"
        createRectTexture(this.scene, buttonSprite, 293, 89, 0xffffff, 1, 2.5, 0x000000, 1, 14)

        const buttonStyle = { ...TEXT_CONFIG };
        buttonStyle.fontFamily = this.scene.fontFamilies.normal;
        buttonStyle.fontSize = '46px';
        buttonStyle.fontStyle = 'bold';
        buttonStyle.color = this.scene.colors.white.hex.getNumberSign;
        
        const button = this.createButton(40, passwordInput.y + passwordInput.height + OFFSET_Y * 2.5, buttonSprite, "loginButton", () => {
            this.scene.changeToMainScreen()
        }, buttonStyle)
        container.add(button)

        container.setScale(SCALE)
    }

    createButton(x, y, sprite, transId, onClick, style) {
        let button = this.scene.createButton(x, y, sprite, transId, onClick, style)

        let buttonImg = button.fillImg
        
        buttonImg.off('pointerout')
        this.scene.addButtonInteractionAnim(buttonImg, buttonImg, button.nCol, button.hCol)
        buttonImg.restartInteractionAnim()

        return button
    }
}