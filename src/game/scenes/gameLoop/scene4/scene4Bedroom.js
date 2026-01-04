import BaseScene from '../baseScene.js';

export default class Scene4Bedroom extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene4Bedroom", 'Scene4Bedroom');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);
        

        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene4Bedroom');
        let generalNodes = this.cache.json.get('generalDialogs');

        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });


        // Armario
        let closetNode = super.readNodes(generalNodes, "generalDialogs", "closet", true);
        super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
            this.dialogManager.setNode(closetNode, []);
        }, false, "closet");
        
        // Cama
        let bedNode = super.readNodes(nodes, "scene4\\scene4Bedroom", "bed", true);
        super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
            this.dialogManager.setNode(bedNode, []);
        }, false, "bed");
        
        let phoneNode = super.readNodes(nodes, "scene4\\scene4Bedroom", "phone", true);
        this.phoneManager.phone.setChatNode(this.chatName, phoneNode);

        
        // // Al producirse, se cambia el nodo de la cama
        this.dispatcher.add("chatEnded", this, () =>{
            bedNode = super.readNodes(generalNodes, "generalDialogs", "bed", true);
            closetNode = super.readNodes(generalNodes, "generalDialogs", "closetNight", true);
        });

        // Al producirse, se hace la animacion de cerrar los ojos
        this.dispatcher.add("sleep", this, () => {
            this.UIManager.closeEyes(() => {
                // Una vez termina la animacion, se introduce un retardo y cuando acaba,
                // se cambia a la escena de transicion y luego a la escena del salon del dia siguiente
                setTimeout(() => {
                    let params = {
                        text: this.gameManager.translate("scene5.startWeek", { ns: "transitions", returnObjects: true }),
                        onComplete: () => {
                            this.UIManager.moveLids(true);
                            this.gameManager.changeScene("Scene5Livingroom");
                        },
                    };
                    // TRACKER EVENT
                    // console.log("Fin del dia 4");
                    this.gameManager.sendGameProgress();

                    // TODO: DISCARDED TRACKER EVENT
                    // console.log("Inicio del dia 5");
                
                    this.gameManager.changeScene("TextOnlyScene", params);
                }, 1000);
            });
        });
    }
    
    
}
