import { Scene } from "phaser";

export default class BaseScreen extends Phaser.GameObjects.Container {
    /**
     * Pantalla base para las distintas pantallas del telefono
     * @extends Phaser.GameObjects.Container
     * @param {Scene} scene - escena a la que pertenece (UIManager)
     * @param {Phone} phone - telefono
     * @param {String} bgImage - id de la imagen de fondo
     * @param {BaseScreen} prevScreen - pantalla anterior
     */
    constructor(scene, phone, bgImage, prevScreen) {
        super(scene, 0, 0);
        this.scene = scene;
        this.phone = phone;

        this.gameManager = scene.gameManager;
        this.i18next = this.gameManager.i18next;

        this.prevScreen = prevScreen;

        this.BG_X = scene.CANVAS_WIDTH / 2;
        this.BG_Y = scene.CANVAS_HEIGHT / 2;

        // Se ponen las imagenes en la pantalla
        this.bg = scene.add.image(this.BG_X, this.BG_Y, bgImage);

        // Se anaden las imagenes a la escena
        this.add(this.bg);

        this.sendToBack(this.bg);
        this.bg.setInteractive();
    }
}