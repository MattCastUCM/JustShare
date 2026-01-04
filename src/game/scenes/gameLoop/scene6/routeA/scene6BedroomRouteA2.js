import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6BedroomRouteA2 extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6BedroomRouteA2", 'Scene6BedroomRouteA2');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'bedroomBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);
        
        // Retrato del padre
        let dadTr = this.portraitTr;
        dadTr.x = this.CANVAS_WIDTH / 2;
        let dadPortrait = new Portrait(this, "dad", dadTr, "dad");
        this.portraits.set("dad", dadPortrait);
        
        
        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene6BedroomRouteA2');

        let node = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "dad", true);
        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [dadPortrait]);
        }
        
        let bedNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "bed", true);
        let pcNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "computer", true);
        let closetNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "closet", true);

        // Al producirse, hace aparecer los elementos interactuables
        this.dispatcher.add("spawnInteractions", this, () => {
            // Armario
            super.createInteractiveElement(240, 400, "pointer", 0.3, () => {
                if (this.gameManager.getValue("endedLunch")) {
                    this.gameManager.setValue("prepared", true)
                }
                this.dialogManager.setNode(closetNode, []);
            }, false, "closet");
            
            // Cama
            super.createInteractiveElement(790, 550, "pointer", 0.3, () => {
                this.dialogManager.setNode(bedNode, []);
            }, false, "bed");

            // Ordenador
            super.createInteractiveElement(1390, 400, "pointer", 0.3, () => {
                this.dialogManager.setNode(pcNode, []);
            }, false, "computer");

            // Puerta
            super.createInteractiveElement(120, this.CANVAS_HEIGHT - 120, "exit", 0.4, () => {
                this.gameManager.changeScene("Scene6LunchRouteA", null, true);
            }, false, "livingroomDoor");
        });


        // Al producirse, cambia los nodos de dialogo de los elementos interactuables
        this.dispatcher.add("endLunch", this, () => {
            bedNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "bedAfterLunch", true);
            pcNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "computerAfterLunch", true);
            closetNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "closetAfterLunch", true);
        });
        
        // Al producirse, cambia el nodo de dialogo del armario
        this.dispatcher.add("prepare", this, () => {
            closetNode = super.readNodes(nodes, "scene6\\routeA\\scene6BedroomRouteA2", "closetAfterDressing", true);
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        this.UIManager.openEyes(() => {
            // Una vez termina la animacion, se introduce un retardo y cuando acaba,
            // se cambia a la escena de transicion y luego a la escena de la comida del dia siguiente
            setTimeout(() => {
                this.setNode();
            }, 500);
        });
        
    }
}
