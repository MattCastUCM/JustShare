import BaseScene from '../baseScene.js';

export default class Scene1Bedroom2 extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene1Bedroom2", 'Scene1Bedroom2');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        
        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene1Bedroom2');
        let generalNodes = this.cache.json.get('generalDialogs');

        // Armario
        let closetNode = super.readNodes(generalNodes, "generalDialogs", "closet", true);
        super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
            this.dialogManager.setNode(closetNode, []);
        }, false, "closet");
        
        // Cama
        let bedNode = super.readNodes(nodes, "scene1\\scene1Bedroom2", "bed", true);
        super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
            this.dialogManager.setNode(bedNode, []);
        }, false, "bed");
        
        // Ordenador
        this.computer.socialMediaScreen.addDirectChat("harasser")
        let pcNode = super.readNodes(nodes, "scene1\\scene1Bedroom2", "computer", true);
        this.dialogManager.setNode(pcNode, []);

        this.computer.socialMediaScreen.addPost("toniPost2", "toni")
        let postNode = super.readNodes(nodes, "scene1\\scene1Bedroom2", "toniPost2", true);
        this.dialogManager.setNode(postNode, []);

        let canUseComputer = true

        super.createInteractiveElement(1390, 400, "pointer", 0.3, () => {
            if(canUseComputer) {
                this.gameManager.switchToComputer()
            }
            else {
                this.dialogManager.setNode(pcNode, []);
            }
        }, false, "computer");

        
        // Al producirse, se hace la animacion de cerrar los ojos
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
                // se cambia a la escena de transicion y luego a la escena del recreo del dia siguiente
                setTimeout(() => {
                    let params = {
                        text: this.gameManager.translate("scene2.startWeek", { ns: "transitions", returnObjects: true }),
                        onComplete: () => {
                            this.UIManager.moveLids(true);
                            this.gameManager.changeScene("Scene2Break");
                        },
                    };
                    // TRACKER EVENT
                    // console.log("Fin del dia 1");
                    this.gameManager.sendGameProgress();

                    // TODO: DISCARDED TRACKER EVENT
                    // console.log("Inicio del dia 2");
                    
                    this.gameManager.changeScene("TextOnlyScene", params);
                }, 1000);
            });
        });
    }
    
}
