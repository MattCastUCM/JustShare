import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene1Lunch2 extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene1Lunch2", 'Scene1Lunch2');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'livingroomInsideBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        
        // Retrato del padre
        let dadTr = this.portraitTr;
        dadTr.x = this.CANVAS_WIDTH / 2 + this.CANVAS_WIDTH / 5;
        let dadPortrait = new Portrait(this, "dad", dadTr, "dad");
        this.portraits.set("dad", dadPortrait);

        // Retrato de la madre
        let momTr = this.portraitTr;
        momTr.x =  this.CANVAS_WIDTH / 2 - this.CANVAS_WIDTH / 5;
        let momPortrait = new Portrait(this, "mom", momTr, "mom")
        momPortrait.setFlipX(true);
        this.portraits.set("mom", momPortrait);

        
        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene1Lunch2');
        let node = super.readNodes(nodes, "scene1\\scene1Lunch2", "main", true);
        
        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [dadPortrait, momPortrait]);
        }


        // Al producirse, se crean los elementos interactuables de la escena
        this.dispatcher.add("parentsLeave", this, () => {
            let doorNode = super.readNodes(nodes, "scene1\\scene1Lunch2", "door", true);
            super.createInteractiveElement(890, 380, "pointer", 0.3, () => {
                this.dialogManager.setNode(doorNode, []);
            }, false, "exitDoor");

            super.createInteractiveElement(1140, 380, "enter", 0.4, () => {
                this.gameManager.changeScene("Scene1Bedroom2", null, true);
            }, false, "bedroomDoor");
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        setTimeout(() => {
            this.setNode();
        }, 500);
    }
    
}
