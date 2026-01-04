import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6BedroomRouteB extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6BedroomRouteB", 'Scene6BedroomRouteB');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);


        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene6BedroomRouteB');
        let generalNodes = this.cache.json.get('generalDialogs');

        let chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        this.phoneManager.phone.addChat(chatName, "harasserPfp");
        let phoneNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "harasserChat", true);
        this.dialogManager.setNode(phoneNode, []);

        this.phoneManager.togglePhone(true, 100, () => {
            this.phoneManager.phone.toChatScreen(chatName);
        });

        // Armario
        let closetNode = super.readNodes(generalNodes, "generalDialogs", "closet", true);
        super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
            this.dialogManager.setNode(closetNode, []);
        }, false, "closet");

        // Cama
        let bedNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "bedStart", true);
        super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
            this.dialogManager.setNode(bedNode, []);
        }, false, "bed");


        this.dispatcher.add("harasserChatEnded", this, () => {
            chatName = this.gameManager.translate("textMessages.chat5", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "unknownPfp");
            phoneNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "chat2", true);
            this.phoneManager.phone.setChatNode(chatName, phoneNode);

            bedNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "bedBeforeLaura", true);
        });

        this.dispatcher.add("chat2Ended", this, () => {
            chatName = this.gameManager.translate("textMessages.chat6", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "unknownPfp");
            phoneNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "chat3", true);
            this.phoneManager.phone.setChatNode(chatName, phoneNode);
        });

        this.dispatcher.add("chat3Ended", this, () => {
            chatName = this.gameManager.translate("textMessages.chat1", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "lauraPfp");
            phoneNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "lauraChat", true);
            this.phoneManager.phone.setChatNode(chatName, phoneNode);
        });


        // Ordenador        
        let photo = 'playerPhoto5Male'
        if (this.gameManager.getUserInfo().gender == "female") {
            photo = 'playerPhoto5Female'
        }
        this.computer.socialMediaScreen.addPost("harasserPost", "harasser", photo)
        this.computer.socialMediaScreen.falsifyCommentaries("harasserPost", 4)
        this.computer.socialMediaScreen.focusOnFirstPost()
        let computerCamera = this.gameManager.computer.cameras.main

        // Al producirse, se cambian los nodos de la cama y el armario
        this.dispatcher.add("lauraChatEnded", this, () => {
            bedNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "bedAfterLaura", true);
            closetNode = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "closet", true);

            // Ordenador
            super.createInteractiveElement(1390, 400, "pointer", 0.3, () => {
                this.computer.socialMediaScreen.reset()
                this.gameManager.switchToComputer(() => {
                    // Efectos
                    computerCamera.postFX.addBloom('0xFFFFFF', 1, 1, 1, 1, 5)
                    computerCamera.postFX.addVignette(0.5, 0.55, 0.54, 0.5)
                    computerCamera.shake(20000, 0.001)

                    let node = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "stress", true);
                    this.dialogManager.setNode(node, []);
                })
            }, false, "computer");
        });

        this.dispatcher.add("panic", this, () => {

            this.gameManager.leaveComputer(() => {
                computerCamera.postFX.clear()

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

                let node = null;
                if (this.gameManager.getValue("explained")) {
                    node = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "interruptionExplained", true);
                }
                else {
                    node = super.readNodes(nodes, "scene6\\routeB\\scene6BedroomRouteB", "interruptionNotExplained", true);
                }
                setTimeout(() => {
                    this.dialogManager.setNode(node, [dadPortrait, momPortrait]);
                }, 500);
            })
        });

        this.dispatcher.add("end", this, () => {
            let params = {
                fadeOutTime: 1000,
                text: this.gameManager.translate("scene6.routeBPoliceStation", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene6PoliceStationRouteB");
                },
            };
            this.gameManager.changeScene("TextOnlyScene", params);
        });
    }

}
