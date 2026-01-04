import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene6Livingroom extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6Livingroom", 'Scene6Livingroom');
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
        momTr.x = this.CANVAS_WIDTH / 2 - this.CANVAS_WIDTH / 5;
        let momPortrait = new Portrait(this, "mom", momTr, "mom")
        momPortrait.setFlipX(true);
        this.portraits.set("mom", momPortrait);


        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene6Livingroom');
        let node = super.readNodes(nodes, "scene6\\scene6Livingroom", "main", true);
        let phoneNode = super.readNodes(nodes, "scene6\\scene6Livingroom", "phone", true);

        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        this.phoneManager.icon.disableInteractive();
        this.phoneManager.phone.setChatNode(this.chatName, phoneNode);

        
        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [momPortrait, dadPortrait]);
        }

        // Al producirse, se crean los elementos interactuables de la escena
        this.dispatcher.add("processMsg", this, () => {
            this.dialogManager.textbox.activate(false);

            setTimeout(() => {
                this.dialogManager.processNode();
                this.phoneManager.phone.setChatNode(this.chatName, null);
            }, 500);
        });

        // Al producirse, se crean los elementos interactuables de la escena
        this.dispatcher.add("endConversation", this, () => {
            // PEDRO
            this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
            let chat = this.phoneManager.phone.chats.get(this.chatName);
            chat.disableInteractive()

            this.phoneManager.icon.setInteractive();

            let generalNodes = this.cache.json.get('generalDialogs');
            let doorNode = super.readNodes(generalNodes, "generalDialogs", "door", true);
            super.createInteractiveElement(890, 380, "pointer", 0.3, () => {
                this.dialogManager.setNode(doorNode, []);
            }, false, "exitDoor");

            super.createInteractiveElement(1140, 380, "enter", 0.4, () => {
                this.gameManager.changeScene("Scene6Bedroom", null, true);
            }, false, "bedroomDoor");
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        // Quitar notificaciones de los mensajes anteriores
        this.phoneManager.phone.toChatScreen(this.chatName);
        setTimeout(() => {
            this.phoneManager.phone.toMessagesListScreen();
        }, 50);

        setTimeout(() => {
            this.setNode();
        }, 500);
    }
}
