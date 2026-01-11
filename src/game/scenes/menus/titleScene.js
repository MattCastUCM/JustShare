import ComputerBaseScene from '../../computer/computerBaseScene';
import { createRectTexture } from '../../utils/graphics';

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

        const buttonSprite = "titleButton"
        createRectTexture(this, buttonSprite, 345, 105, 0xffffff, 1, 2.5, 0x000000, 1, 14)

        let playButton = this.createButton(this.CANVAS_WIDTH / 2.9, 3.5 * this.CANVAS_HEIGHT / 8, buttonSprite, "playButton", () => {
            this.sceneManager.changeScene("LoginScene")
        }, SCALE);

        this.createButton(playButton.x, playButton.y + playButton.height + OFFSET_Y, buttonSprite, "creditsButton", () => {
            this.sceneManager.changeScene("CreditsScene")
        }, SCALE);
    }
}