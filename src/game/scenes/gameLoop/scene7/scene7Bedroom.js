import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene7Bedroom extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene7Bedroom", 'Scene7Bedroom');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let dreamBg = this.add.image(0, 0, 'dream').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / dreamBg.height;
        dreamBg.setScale(this.scale);
        dreamBg.depth = 100;

        let bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);


        this.phoneManager.activatePhoneIcon(false);
        this.phoneManager.phone.reset();

        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene7Bedroom');


        // Laura
        let chatName = this.gameManager.translate("textMessages.chat1", { ns: "deviceInfo", returnObjects: true });
        this.phoneManager.phone.addChat(chatName, "lauraPfp");
        let phoneNode = super.readNodes(nodes, "scene7\\scene7Bedroom", "lauraChat", true);
        this.phoneManager.phone.setChatNode(chatName, phoneNode);
        
        // Quitar notificaciones de los mensajes anteriores
        this.dispatcher.add("endLauraChatReconstruction", this, () => {
            this.phoneManager.phone.toChatScreen(chatName);

            chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "harasserPfp");
            phoneNode = super.readNodes(nodes, "scene7\\scene7Bedroom", "phone", true);
            this.dialogManager.setNode(phoneNode, []);

            this.phoneManager.togglePhone(true, 0, () => {
                // Volver al chat del acosador
                this.phoneManager.phone.toChatScreen(chatName);

                this.phoneManager.bgBlock.disableInteractive();
                this.phoneManager.phone.returnButton.disableInteractive();
                this.phoneManager.phone.chats.get(chatName).returnButton.disableInteractive();
            });
        });


        this.dispatcher.add("chatEnded", this, () => {
            this.dialogManager.textbox.activate(false);
            let chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.chats.get(chatName).returnButton.setInteractive();

            chatName = this.gameManager.translate("textMessages.chat3", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "dadPfp");

            let phoneNode = super.readNodes(nodes, "scene7\\scene7Bedroom", "callButton", true);
            this.phoneManager.phone.setChatNode(chatName, phoneNode);
        });

        this.dispatcher.add("call", this, () => {
            this.phoneManager.togglePhone(false);

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

            let node = super.readNodes(nodes, "scene7\\scene7Bedroom", "call", true);
            this.dialogManager.setNode(node, [dadPortrait, momPortrait]);
        });


        this.dispatcher.add("end", this, () => {
            let params = {
                fadeOutTime: 1000,
                text: this.gameManager.translate("scene7.end", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    // TRACKER EVENT
                    // console.log("Fin de partida");
                    this.gameManager.sendEndGame();
                    
                    this.gameManager.startTitleScene();
                },
            };
            // TODO: DISCARDED TRACKER EVENT
            // console.log("Fin del dia 7");

            this.gameManager.changeScene("TextOnlyScene", params);
        });

    }

}
