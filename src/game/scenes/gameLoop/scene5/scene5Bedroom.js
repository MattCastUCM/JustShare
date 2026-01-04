import BaseScene from '../baseScene.js';

export default class Scene5Bedroom extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene5Bedroom", 'Scene5Bedroom');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);
        
        
        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene5Bedroom');
        let generalNodes = this.cache.json.get('generalDialogs');

        // Armario
        let closetNode = super.readNodes(nodes, "scene5\\scene5Bedroom", "closet", true);
        super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
            this.dialogManager.setNode(closetNode, []);
        }, false, "closet");
        
        // Cama
        let bedNode = super.readNodes(nodes, "scene5\\scene5Bedroom", "bed", true);
        super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
            this.dialogManager.setNode(bedNode, []);
        }, false, "bed");
        

        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        let phoneNode = super.readNodes(nodes, "scene5\\scene5Bedroom", "phone", true);
        this.dialogManager.setNode(phoneNode, []);
        

        // Al producirse, se cambian los dialogos de la cama y el armario
        this.dispatcher.add("chatEnded", this, () => {
            bedNode = super.readNodes(generalNodes, "generalDialogs", "bed", true);
            closetNode = super.readNodes(generalNodes, "generalDialogs", "closetNight", true);
        });
        
        // Al producirse, se hace la animacion de cerrar los ojos
        this.dispatcher.add("sleep", this, () => {
            this.UIManager.closeEyes(() => {
                // Una vez termina la animacion, se introduce un retardo y cuando acaba,
                // se cambia a la escena de transicion y luego a la escena de la comida del dia siguiente
                setTimeout(() => {
                    let params = {
                        text: this.gameManager.translate("scene6.startWeek", { ns: "transitions", returnObjects: true }),
                        onComplete: () => {
                            this.UIManager.moveLids(true);
                            this.gameManager.changeScene("Scene6Livingroom");
                        },
                    };
                    // TRACKER EVENT
                    // console.log("Fin del dia 5");
                    this.gameManager.sendGameProgress();

                    // TODO: DISCARDED TRACKER EVENT
                    // console.log("Inicio del dia 6");
                
                    this.gameManager.changeScene("TextOnlyScene", params);
                }, 1000);
            });
        });
    }

    onCreate() {
        // Quitar notificaciones de los mensajes anteriores
        this.phoneManager.phone.toChatScreen(this.chatName);
        setTimeout(() => {
            this.phoneManager.phone.toMessagesListScreen();
        }, 50);
    }
    
}
