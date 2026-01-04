import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6LunchRouteB extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6LunchRouteB", 'Scene6LunchRouteB');
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
        momTr.x =  this.CANVAS_WIDTH / 2 - this.CANVAS_WIDTH / 5;
        let momPortrait = new Portrait(this, "mom", momTr, "mom")
        momPortrait.setFlipX(true);
        this.portraits.set("mom", momPortrait);


        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene6LunchRouteB');
        let node = super.readNodes(nodes, "scene6\\routeB\\scene6LunchRouteB", "start", true);

        let chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        let phoneNode = super.readNodes(nodes, "scene6\\routeB\\scene6LunchRouteB", "phone", true);
        this.phoneManager.phone.setChatNode(chatName, phoneNode);

        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, []);
        }


        // Al producirse, cambia a la escena de transicion y vuelve a la misma escena
        this.dispatcher.add("chatEnded", this, () => {
            this.phoneManager.togglePhone(false);

            node = super.readNodes(nodes, "scene6\\routeB\\scene6LunchRouteB", "interruption", true);
            this.dialogManager.setNode(node, [momPortrait, dadPortrait]);
        });

        // Al producirse, cambia a la escena de la calle
        this.dispatcher.add("endInterruption", this, () => {
            let params = {
                text: this.gameManager.translate("scene6.routeBAfterLunch", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene6BedroomRouteB");
                },
            };
            this.gameManager.changeScene("TextOnlyScene", params);
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        setTimeout(() => {
            this.setNode();
        }, 500);
    }
    
}
