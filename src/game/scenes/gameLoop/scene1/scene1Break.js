import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene1Break extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene1Break", 'Scene1Break');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'canteenBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        // Retrato de laura
        let lauraTr = this.portraitTr;
        lauraTr.x = this.CANVAS_WIDTH / 2;
        let lauraPortrait = new Portrait(this, "laura", lauraTr, "laura")
        lauraPortrait.setFlipX(true);
        this.portraits.set("laura", lauraPortrait);

        
        // Lee el archivo de nodos
        this.nodes = this.cache.json.get('scene1Break');

        // Crea las mesas
        this.addTables();


        // Al producirse, se cambia a la escena de transicion y luego a la escena del salon
        this.dispatcher.add("endBreak", this, () => {
            let params = {
                text: this.gameManager.translate("scene1.classEnd", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene1Lunch1");
                },
            };
            this.gameManager.changeScene("TextOnlyScene", params);
        });
    }


    // Crea las mesas como objetos interactuables
    addTables() {
        this.interactedTables = 0;

        let nodeTable1 = super.readNodes(this.nodes, "scene1\\scene1Break", "tables1", true);
        super.createInteractiveElement(550, 480, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeTable1, []);
            this.interactedTables++;
        }, true, "table");

        let nodeTable2 = super.readNodes(this.nodes, "scene1\\scene1Break", "tables2", true);
        super.createInteractiveElement(980, 460, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeTable2, []);
            this.interactedTables++;
        }, true, "table");
        
        let nodeTable3 = super.readNodes(this.nodes, "scene1\\scene1Break", "tables3", true);
        super.createInteractiveElement(1300, 520, "pointer", 0.4, () => {
            this.dialogManager.setNode(nodeTable3, []);
            this.interactedTables++;
        }, true, "table");


        // Al producirse, comprueba si se ha interactuado con todas las mesas
        this.dispatcher.add("checkAllTables", this, () => {
            this.checkAllTables();
        });


    }

    // Comprueba si se ha interactuado con todas las mesas y si es asi, cambia el nodo de dialogo
    checkAllTables() {
        if (this.interactedTables >= 3) {
            let node = super.readNodes(this.nodes, "scene1\\scene1Break", "mainConversation", true);
            setTimeout(() => {
                this.dialogManager.setNode(node, [this.portraits.get("laura")]); 
            }, 500);
        }
    }
}
