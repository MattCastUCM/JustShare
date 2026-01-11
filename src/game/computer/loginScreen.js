import { createRectTexture } from "../utils/graphics";
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

        let nameInput = this.scene.createTextInputWithSideText(OFFSET_X, 0, textInputSprite, "usernameInput", 1, true)
        nameInput.textInput.addText(this.username);
        container.add(nameInput);

        let passwordInput = this.scene.createTextInputWithSideText(nameInput.x, nameInput.y + nameInput.height + OFFSET_Y, textInputSprite, "passwordInput", 1, true)
        passwordInput.textInput.addText("**********");
        container.add(passwordInput);

        const loginButtonSprite = "loginScreenButton"
        createRectTexture(this.scene, loginButtonSprite, 345, 105, 0xffffff, 1, 2.5, 0x000000, 1, 14)
        
        let loginButton = this.createButton(40, passwordInput.y + passwordInput.height + OFFSET_Y * 2.5, loginButtonSprite, "loginButton", () => {
            this.scene.changeToMainScreen()
        }, 0.85)
        container.add(loginButton)

        container.setScale(SCALE)
    }

    createButton(x, y, sprite, transId, onClick, scale = 1) {
        let button = this.scene.createButton(x, y, sprite, transId, onClick, scale)

        let buttonImg = button.fillImg

        buttonImg.off('pointerout')
        this.scene.addButtonInteractionAnim(buttonImg, buttonImg, button.nCol, button.hCol)
        buttonImg.restartInteractionAnim()

        return button
    }
}