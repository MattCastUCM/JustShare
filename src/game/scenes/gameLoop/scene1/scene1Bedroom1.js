import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene1Bedroom1 extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene1Bedroom1", 'Scene1Bedroom1');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomBg').setOrigin(0, 0);
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
        let nodes = this.cache.json.get('scene1Bedroom1');
        let generalNodes = this.cache.json.get('generalDialogs');

        // Armario
        let closetNode = super.readNodes(generalNodes, "generalDialogs", "closet", true);
        super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
            this.dialogManager.setNode(closetNode, []);
        }, false, "closet");

        // Cama
        let bedNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "bed", true);
        super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
            this.dialogManager.setNode(bedNode, []);
        }, false, "bed");


        // Ordenador
        // Chats
        this.computer.socialMediaScreen.addDirectChat("ana")
        let chatNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computerChats.ana", true);
        this.dialogManager.setNode(chatNode, []);

        this.computer.socialMediaScreen.addDirectChat("harasser")
        let pcNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computer1", true);
        this.dialogManager.setNode(pcNode, []);

        this.computer.socialMediaScreen.addDirectChat("mike")
        chatNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computerChats.mike", true);
        this.dialogManager.setNode(chatNode, []);

        // Posts
        this.computer.socialMediaScreen.addPost("rndPost1", "ana")

        this.computer.socialMediaScreen.addPost("toniPost1", "toni", "puzzleBooblePicture")
        let postNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computerPosts.toniPost1", true);
        this.dialogManager.setNode(postNode, []);

        this.computer.socialMediaScreen.addPost("rndPost2", "mike")

        this.computer.socialMediaScreen.addPost("rndPost3", "mary", "seaPicture")
        postNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computerPosts.rndPost3", true);
        this.dialogManager.setNode(postNode, []);

        let canUseComputer = true

        super.createInteractiveElement(1390, 400, "pointer", 0.3, () => {
            if (canUseComputer) {
                this.gameManager.switchToComputer()
            }
            else {
                this.dialogManager.setNode(pcNode, []);
            }
        }, false, "computer");


        this.dispatcher.add("answerDoor", this, () => {
            canUseComputer = false
            this.gameManager.leaveComputer(() => {
                let node = super.readNodes(nodes, "scene1\\scene1Bedroom1", "interruption", true);
                this.dialogManager.setNode(node, [momPortrait, dadPortrait]);

                pcNode = super.readNodes(nodes, "scene1\\scene1Bedroom1", "homework", true);
            })
        });

        // Al producirse, se cambia el dialogo de la cama
        this.dispatcher.add("endHomework", this, () => {
            canUseComputer = true

            let node = super.readNodes(nodes, "scene1\\scene1Bedroom1", "computer2", true);
            this.computer.socialMediaScreen.setChatNode("harasser", node)
        });

        // Al producirse, se cambia el dialogo de la cama
        this.dispatcher.add("endConversation", this, () => {
            canUseComputer = false
            pcNode = super.readNodes(generalNodes, "generalDialogs", "computerNight", true);

            bedNode = super.readNodes(generalNodes, "generalDialogs", "bed", true);
            closetNode = super.readNodes(generalNodes, "generalDialogs", "closetNight", true);

            let depth = bg.depth;
            bg.destroy();
            bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0).setDepth(depth - 1);
        });

        // Al producirse, se hace la animacion de cerrar los ojos
        this.dispatcher.add("sleep", this, () => {
            this.UIManager.closeEyes(() => {
                // Una vez termina la animacion, se introduce un retardo y cuando acaba,
                // se cambia a la escena de transicion y luego a la escena del comedor del dia siguiente
                setTimeout(() => {
                    let params = {
                        text: this.gameManager.translate("scene1.nextDay", { ns: "transitions", returnObjects: true }),
                        onComplete: () => {
                            this.UIManager.moveLids(true);
                            this.gameManager.changeScene("Scene1Lunch2");
                        },
                    };
                    this.gameManager.changeScene("TextOnlyScene", params);
                }, 1000);
            });
        });
    }

}
