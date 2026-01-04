import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6PoliceStationRouteB extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6PoliceStationRouteB", 'Scene6PoliceStationRouteB');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'policeStationBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        
        // Retrato del padre
        let dadTr = this.portraitTr;
        dadTr.x = this.CANVAS_WIDTH / 2 + this.CANVAS_WIDTH / 5;
        let dadPortrait = new Portrait(this, "dad", dadTr, "dad");
        this.portraits.set("dad", dadPortrait);
        
        // Retrato del agente
        let officerTr = this.portraitTr;
        officerTr.x =  this.CANVAS_WIDTH / 2 - this.CANVAS_WIDTH / 5;
        officerTr.y += 100;
        officerTr.scale *= 1.15;
        let officerPortrait = new Portrait(this, "officer", officerTr, "officer")
        officerPortrait.setFlipX(true);
        this.portraits.set("officer", officerPortrait);

        this.phoneManager.activatePhoneIcon(false);

        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene6PoliceStationRouteB');
        let node = super.readNodes(nodes, "scene6\\routeB\\scene6PoliceStationRouteB", "", true);

        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [dadPortrait, officerPortrait]);
        }

        
        this.dispatcher.add("end", this, () => {
            let params = {
                fadeOutTime: 1000,
                text: this.gameManager.translate("scene6.routeBEnd", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene6EndingRouteB");
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
