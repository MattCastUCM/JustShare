import ComputerBaseScene from '../../computer/computerBaseScene.js';

export default class CreditsScene extends ComputerBaseScene {
    constructor() {
        super("CreditsScene")
    }
    
    create(params) {
        super.create(params)        

        this.createBackground('creditsScreen')
        this.setNamespace('menus/creditsScene')

        this.createPowerIcon(() => {
            this.gameManager.changeScene("TitleScene");
        })

        const TITLE_OFFSET_Y = 60
        const CREATORS_OFFSET_Y = 25
        
        let titleStyle = {...this.style}
        titleStyle.fontSize = '85px'
        titleStyle.fontFamily = this.fontFamilies.bold
        
        let translate = this.translate("creatorsTitle")
        let title = this.add.text(this.CANVAS_WIDTH / 2, 1.6 * this.CANVAS_HEIGHT / 6, translate, titleStyle)
        title.setOrigin(0.5, 0.5)
        
        let style = {...this.style}
        style.fontSize = '48px'
        
        let creator1 = this.add.text(title.x, title.y + title.displayHeight + TITLE_OFFSET_Y, "Matt Castellanos Silva", style)
        creator1.setOrigin(0.5, 0.5)
        
        let creator2 = this.add.text(creator1.x, creator1.y + creator1.displayHeight + CREATORS_OFFSET_Y, "Pedro León Miranda", style)
        creator2.setOrigin(0.5, 0.5)

        let creator3 = this.add.text(creator2.x, creator2.y + creator2.displayHeight + CREATORS_OFFSET_Y, "Raúl Pérez Cogolludo", style)
        creator3.setOrigin(0.5, 0.5)
    }
}