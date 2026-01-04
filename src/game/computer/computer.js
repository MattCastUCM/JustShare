import ComputerBaseScene from "./computerBaseScene.js"
import LoginScreen from "./loginScreen.js"
import SocialMediaScreen from "./socialMediaScreen.js";

export default class Computer extends ComputerBaseScene {
    constructor() {
        super("Computer", "computer/computer");
    }

    create(params) {
        super.create(params)

        const N_RANDOM_DIGITS = 4
        this.username = this.gameManager.getUserInfo().name
        for (let i = 0; i < N_RANDOM_DIGITS; ++i) {
            this.username += this.getRandomInt(0, 9)
        }

        this.socialMediaScreen = new SocialMediaScreen(this);
        this.socialMediaScreen.setVisible(false)

        this.loginScreen = new LoginScreen(this);

        this.createPowerIcon(() => {
            this.gameManager.leaveComputer()

            setTimeout(() => {
                this.socialMediaScreen.reset();
            }, this.gameManager.FADE_OUT_TIME)

            // TRACKER EVENT
            // console.log("Salir del ordenador");
            this.gameManager.sendItemInteraction("powerOffButton");
        });

        this.changeToMainScreen()


        this.input.on('pointerdown', (pointer) => {
            // console.log(pointer.x, pointer.y);

            // TRACKER EVENT
            // console.log("Pulsar en la pantalla del ordenador");
            this.gameManager.sendComputerScreenClick(pointer.x, pointer.y);
        });
    }

    getUsername() {
        return this.username
    }

    changeToMainScreen() {
        if (this.loginScreen != null) {
            this.loginScreen.destroy()
            this.loginScreen = null
        }
        this.socialMediaScreen.setVisible(true)
        this.socialMediaScreen.init()
    }
}