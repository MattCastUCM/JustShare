import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6EndingRouteB extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6EndingRouteB", 'Scene6EndingRouteB');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomNightBg').setOrigin(0, 0);
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
        let nodes = this.cache.json.get('scene6EndingRouteB');
        let node = super.readNodes(nodes, "scene6\\routeB\\scene6EndingRouteB", "main", true);

        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [momPortrait, dadPortrait]);
        }
        
        
        this.dispatcher.add("end", this, () => {
            setTimeout(() => {
                // Armario
                let closetNode = super.readNodes(nodes, "scene6\\routeB\\scene6EndingRouteB", "closet", true);
                super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
                    this.dialogManager.setNode(closetNode, []);
                }, false, "closet");

                // Cama
                let bedNode = super.readNodes(nodes, "scene6\\routeB\\scene6EndingRouteB", "bed", true);
                super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
                    this.dialogManager.setNode(bedNode, []);
                }, false, "bed");


                // Ordenador
                let pcNode = super.readNodes(nodes, "scene6\\routeB\\scene6EndingRouteB", "computer", true);
                super.createInteractiveElement(1390, 400, "pointer", 0.3, () => {
                    this.dialogManager.setNode(pcNode, []);
                }, false, "computer");
            }, 500);
        });

        // Al producirse, se hace la animacion de cerrar los ojos
        this.dispatcher.add("sleep", this, () => {
            this.UIManager.closeEyes(() => {
                // Una vez termina la animacion, se introduce un retardo y cuando acaba,
                // se cambia a la escena de transicion y luego a la escena final
                setTimeout(() => {
                    let params = {
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
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        setTimeout(() => {
            this.setNode();
        }, 500);
    }
    
}
