import BaseScreen from "./baseScreen.js";

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

        let nameInput = this.scene.createTextInputWithSideText(OFFSET_X, 0, "usernameInput", 1, true)
        nameInput.textInput.addText(this.username);
        container.add(nameInput);

        let passwordInput = this.scene.createTextInputWithSideText(nameInput.x, nameInput.y + nameInput.height + OFFSET_Y, 
            "passwordInput", 1, true)
        passwordInput.textInput.addText("**********");
        container.add(passwordInput);

        let loginButton = this.createButton(40, passwordInput.y + passwordInput.height + OFFSET_Y * 2.5, "loginButton", () => {
            this.scene.changeToMainScreen()
        }, 0.85)
        container.add(loginButton)

        container.setScale(SCALE)
    }

    createButton(x, y, transId, onClick, scale = 1) {
        let button = this.scene.createButton(x, y, transId, onClick, scale)

        let buttonImg = button.fillImg

        buttonImg.off('pointerout')
        this.scene.addButtonInteractionAnim(buttonImg, buttonImg, button.nCol, button.hCol)
        buttonImg.restartInteractionAnim()

        return button
    }
}