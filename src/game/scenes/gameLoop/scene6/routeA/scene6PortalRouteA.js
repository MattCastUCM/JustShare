import BaseScene from '../../baseScene.js';
import Portrait from '../../../../UI/dialog/portrait.js';

export default class Scene6PortalRouteA extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene6PortalRouteA", 'Scene6PortalRouteA');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'portalBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);
        
        // Retrato del acosador
        let harasserTr = this.portraitTr;
        harasserTr.x = this.CANVAS_WIDTH / 2;
        let harasserPortrait = new Portrait(this, "harasser", harasserTr, "???");
        this.portraits.set("harasser", harasserPortrait);


        // Lee el archivo de nodos
        this.nodes = this.cache.json.get('scene6PortalRouteA');
        this.addDoors();
        
        // Al producirse, se cambian los dialogos de la cama y el armario
        this.dispatcher.add("enter", this, () => {
            let bgDepth = bg.depth;
            bg.setDepth(bgDepth - 1);
            let bg2 = this.add.image(0, 0, 'harasserHouseBg').setOrigin(0, 0).setDepth(bgDepth - 1);
            bg2.alpha = 0;
            // Hace la animacion de fade in para todos los objetos
            this.tweens.add({
                targets: bg2,
                alpha: { from: 0, to: 1 },
                duration: 300,
                repeat: 0,
            });

        });

        // Al producirse, se cambian los dialogos de la cama y el armario
        this.dispatcher.add("end", this, () => {
            let params = {
                fadeOutTime: 1000,
            };
            this.gameManager.changeScene("Scene6EndingRouteA", params);
        });
    }
    
    addDoors() {
        let nodeDoor1 = super.readNodes(this.nodes, "scene6\\routeA\\scene6PortalRouteA", "incorrectDoor1", true);
        let door1 = super.createInteractiveElement(260, 380, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeDoor1, []);
        }, true, "portalDoor");

        let nodeDoor2 = super.readNodes(this.nodes, "scene6\\routeA\\scene6PortalRouteA", "incorrectDoor2", true);
        let door2 = super.createInteractiveElement(820, 330, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeDoor2, []);
        }, true, "portalDoor");

        let nodeDoor3 = super.readNodes(this.nodes, "scene6\\routeA\\scene6PortalRouteA", "incorrectDoor3", true);
        let door3 = super.createInteractiveElement(990, 330, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeDoor3, []);
        }, true, "portalDoor");

        let nodeDoor4 = super.readNodes(this.nodes, "scene6\\routeA\\scene6PortalRouteA", "main", true);
        let door4 = super.createInteractiveElement(490, 330, "pointer", 0.3, () => {
            this.dialogManager.setNode(nodeDoor4, [this.portraits.get("harasser")]);
        }, true, "harasserDoor");


        this.dispatcher.add("enter", this, () => {
            if (door1 != null) {
                door1.destroy();
            }
            if (door2 != null) {
                door2.destroy();
            }
            if (door3 != null) {
                door3.destroy();
            }
        });
    }
}
