
import BaseScene from './baseScene.js';
import Portrait from '../../UI/dialog/portrait.js';

export default class TestScene extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("TestScene", 'TestScene');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'livingroomBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        let momTr = this.portraitTr;
        let momPortrait = new Portrait(this, "mom", momTr)
        momPortrait.setFlipX(true);
        this.portraits.set("mom", momPortrait);

        let dadTr = this.portraitTr;
        dadTr.x += this.CANVAS_WIDTH / 2;
        let dadPortrait = new Portrait(this, "dad", dadTr);
        this.portraits.set("dad", dadPortrait);

        // let friendTr = this.portraitTr;
        // let friendPortrait = new Portrait(this, "friend", friendTr)
        // this.portraits.set("friend", friendPortrait);

        let nodes = this.cache.json.get('test');
        this.node = super.readNodes(nodes, "test", "", true);
        
        this.setNode = () => {
            this.dialogManager.setNode(this.node, [momPortrait, dadPortrait]);
        }
        
        bg.setInteractive();
        bg.on("pointerdown", () => {
            this.setNode();
        })

        this.dispatcher.add("resetGame", this, () => {
            this.gameManager.startTestScene();
        })
        
    }

    // Se hace esto porque si se establece un dialogo en la constructora, 
    // no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        this.dialogManager.changeScene(this)
        this.setNode();
    }

}
