import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6LunchRouteA extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6LunchRouteA", 'Scene6LunchRouteA');
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
        let nodes = this.cache.json.get('scene6LunchRouteA');
        let node = super.readNodes(nodes, "scene6\\routeA\\scene6LunchRouteA", "main", true);
        
        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [dadPortrait, momPortrait]);
        }


        // Al producirse, cambia a la escena de transicion y vuelve a la misma escena
        this.dispatcher.add("endLunch", this, () => {
            let params = {
                text: this.gameManager.translate("scene6.routeALunch", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene6LunchRouteA", null, true);
                    this.endLunch();
                },
            };
            this.gameManager.changeScene("TextOnlyScene", params, true);
        });

        // Se crean los elementos interactuables
        this.endLunch = () => {
            let doorNodePrepared = super.readNodes(nodes, "scene6\\routeA\\scene6LunchRouteA", "doorPrepared", true);
            let doorNodeUnprepared = super.readNodes(nodes, "scene6\\routeA\\scene6LunchRouteA", "doorUnprepared", true);
            
            // Puerta a la calle
            let doorIcon = super.createInteractiveElement(890, 380, "pointer", 0.3, () => {
                // Si no esta preparado, se muestra un dialogo avisando de esto
                if (this.gameManager.getValue("prepared")) {
                    this.dialogManager.setNode(doorNodePrepared, [dadPortrait, momPortrait]);
                    doorIcon.destroy();
                }
                // Si esta preparado, se muestra el dialogo con los padres
                else {
                    this.dialogManager.setNode(doorNodeUnprepared, []);
                }

            }, false, "exitDoor");

            // Puerta a la habitacion
            super.createInteractiveElement(1140, 380, "enter", 0.4, () => {
                this.gameManager.changeScene("Scene6BedroomRouteA2", null, true);
            }, false, "bedroomDoor");
        }

        // Al producirse, cambia a la escena de la calle
        this.dispatcher.add("exitHome", this, () => {
            let params = {
                text: this.gameManager.translate("scene6.routeAWalking", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.UIManager.moveLids(true);
                    this.gameManager.changeScene("Scene6PortalRouteA");
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
