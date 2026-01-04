import ComputerBaseScene from '../../computer/computerBaseScene.js';

export default class TitleScene extends ComputerBaseScene {
    constructor() {
        super("TitleScene")
    }
    
    create(params) {
        super.create(params)
        
        const SCALE = 0.77
        const OFFSET_Y = 90

        this.createBackground('titleScreen')
        this.setNamespace('menus/titleScene')

        let playButton = this.createButton(this.CANVAS_WIDTH / 2.9, 3.5 * this.CANVAS_HEIGHT / 8, "playButton", () => {
            this.gameManager.changeScene("LoginScene")
        }, SCALE);

        this.createButton(playButton.x, playButton.y + playButton.height + OFFSET_Y, 
            "creditsButton", () => {
            this.gameManager.changeScene("CreditsScene")
        }, SCALE);
    }
}