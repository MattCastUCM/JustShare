import BaseScene from '../../baseScene.js';

export default class Scene6EndingRouteA extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6EndingRouteA", 'Scene6EndingRouteA');
    }

    create(params) {
        super.create(params)

        
        // Lee el archivo de nodos
        this.nodes = this.cache.json.get('scene6EndingRouteA');

        
        // Al producirse, se cambian los dialogos de la cama y el armario
        this.dispatcher.add("addMomChat", this, () => {
            let chatName = this.gameManager.translate("textMessages.chat4", { ns: "deviceInfo", returnObjects: true });
            this.phoneManager.phone.addChat(chatName, "momPfp");
            let phoneNode = super.readNodes(this.nodes, "scene6\\routeA\\scene6EndingRouteA", "mom", true);
            this.phoneManager.phone.setChatNode(chatName, phoneNode);
        });

        // Al producirse, se cambian los dialogos de la cama y el armario
        this.dispatcher.add("end", this, () => {
            this.phoneManager.togglePhone(false);
            this.phoneManager.activatePhoneIcon(false);

            // Una vez termina la animacion, se introduce un retardo y cuando acaba,
            // se cambia a la escena de transicion y luego a la escena final
            setTimeout(() => {
                let params = {
                    fadeOutTime: 1000,
                    text: this.gameManager.translate("scene7.start", { ns: "transitions", returnObjects: true }),
                    onComplete: () => {
                        this.UIManager.moveLids(true);
                        this.gameManager.changeScene("Scene7Bedroom");
                    },
                };
                // TRACKER EVENT
                // console.log("Fin del dia 6");
                this.gameManager.sendGameProgress();

                // TODO: DISCARDED TRACKER EVENT
                // console.log("Inicio del dia 7");
                
                this.gameManager.changeScene("TextOnlyScene", params);
            }, 1000);
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        setTimeout(() => {
            this.phoneManager.activatePhoneIcon(true);
            this.phoneManager.togglePhone(true);
            this.phoneManager.bgBlock.disableInteractive();
            this.phoneManager.phone.returnButton.disableInteractive();

            setTimeout(() => {
                let chatName = this.gameManager.translate("textMessages.chat3", { ns: "deviceInfo", returnObjects: true });
                this.phoneManager.phone.addChat(chatName, "dadPfp");
                let phoneNode = super.readNodes(this.nodes, "scene6\\routeA\\scene6EndingRouteA", "dad", true);
                this.phoneManager.phone.setChatNode(chatName, phoneNode);
            }, 1000);
        }, 1000);
    }
}
