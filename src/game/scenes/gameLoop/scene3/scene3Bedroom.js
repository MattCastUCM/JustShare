import BaseScene from '../baseScene.js';

export default class Scene3Bedroom extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene3Bedroom", 'Scene3Bedroom');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        
        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene3Bedroom');
        
        let node = super.readNodes(nodes, "scene3\\scene3Bedroom", "main", true);

        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        let phoneNode = super.readNodes(nodes, "scene3\\scene3Bedroom", "fill", true);
        this.dialogManager.setNode(phoneNode, []);
        
        this.phoneManager.togglePhone(true, 0, () => {
            // Quitar notificaciones de los mensajes anteriores
            this.phoneManager.phone.chats.get(this.chatName).returnButton.disableInteractive();
            this.phoneManager.phone.toChatScreen(this.chatName);
            setTimeout(() => {
                this.dialogManager.setNode(node, []);
            }, 50);
        });
        this.phoneManager.bgBlock.disableInteractive();
        this.phoneManager.phone.returnButton.disableInteractive();
        this.phoneManager.icon.disableInteractive();
        

        let chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        this.phoneManager.phone.addChat(chatName, "harasserPfp");
        
        // Al producirse, se pasa a la siguiente escena
        this.dispatcher.add("endConversation", this, () => {

            setTimeout(() => {
                let params = {
                    fadeOutTime: 1000,
                    text: this.gameManager.translate("scene4.party", { ns: "transitions", returnObjects: true }),
                    onComplete: () => {
                        this.phoneManager.phone.chats.get(this.chatName).returnButton.setInteractive();
                        this.gameManager.changeScene("Scene4Frontyard");
                    },
                };
                this.phoneManager.togglePhone(false);

                this.phoneManager.phone.returnButton.setInteractive();
                this.phoneManager.icon.setInteractive();

                // TRACKER EVENT
                // console.log("Fin del dia 3");
                this.gameManager.sendGameProgress();

                // TODO: DISCARDED TRACKER EVENT
                // console.log("Inicio del dia 4");

                this.gameManager.changeScene("TextOnlyScene", params);
            }, 3000);
        });
    }


    onCreate() {
        
    }

}
