import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene4Backyard extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene4Backyard", 'Scene4Backyard');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'backyardBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        // Retrato de laura
        let lauraTr = this.portraitTr;
        lauraTr.x = this.CANVAS_WIDTH / 2;
        let lauraPortrait = new Portrait(this, "laura", lauraTr, "laura")
        lauraPortrait.setFlipX(true);
        this.portraits.set("laura", lauraPortrait);

        
        // Lee el archivo de nodos
        this.nodes = this.cache.json.get('scene4Backyard');
        
        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        this.phoneManager.phone.addChat(this.chatName, "harasserPfp");


        this.addClassmates();

        // Al producirse, oculta la caja de texto
        this.dispatcher.add("receiveMsg", this, () => {
            setTimeout(() => {
                this.dialogManager.setNode(null, []);
            }, 1);
        });
        
        // Al producirse, hace aparecer el icono de cambiar de escenario
        this.dispatcher.add("endConversation", this, () => {
            super.createInteractiveElement(130, 770, "exit", 0.4, () => {
                this.gameManager.changeScene("Scene4Garage");
            }, true, "enterDoor");
        });
    }

    // Crea a los companeros como objetos interactuables
    addClassmates() {
        this.interactedClassmates = 0;

        let nodeClassmate1 = super.readNodes(this.nodes, "scene4\\scene4Backyard", "classmate1", true);
        super.createInteractiveElement(560, 380, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeClassmate1, []);
            this.interactedClassmates++;
        }, true, "classmate", true);

        let nodeClassmate2 = super.readNodes(this.nodes, "scene4\\scene4Backyard", "classmate2", true);
        super.createInteractiveElement(1030, 460, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeClassmate2, []);
            this.interactedClassmates++;
        }, true, "classmate", true);
        
        let nodeClassmate3 = super.readNodes(this.nodes, "scene4\\scene4Backyard", "classmate3", true);
        super.createInteractiveElement(270, 420, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeClassmate3, []);
            this.interactedClassmates++;
        }, true, "classmate", true);

        let nodeClassmate4 = super.readNodes(this.nodes, "scene4\\scene4Backyard", "classmate4", true);
        super.createInteractiveElement(1370, 380, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeClassmate4, []);
            this.interactedClassmates++;
        }, true, "classmate", true);

        // Al producirse, comprueba si se ha interactuado con todos los companeros
        this.dispatcher.add("checkAllClassmates", this, () => {
            this.checkAllClassmates();
        });
    }

    // Comprueba si se ha interactuado con todos los companeros y si es asi, cambia el nodo de dialogo
    checkAllClassmates() {
        if (this.interactedClassmates >= 4) {
            let node = super.readNodes(this.nodes, "scene4\\scene4Backyard", "mainConversation", true);
            setTimeout(() => {
                this.dialogManager.setNode(node, [this.portraits.get("laura")]); 
            }, 500);
        }
    }
}
