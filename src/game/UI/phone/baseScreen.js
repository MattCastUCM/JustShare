import { Scene, GameObjects } from "phaser";
import GameManager from "../../managers/gameManager";
import TranslatorManager from "../../managers/translatorManager";

export default class BaseScreen extends GameObjects.Container {
    /**
     * Pantalla base para las distintas pantallas del telefono
     * @extends GameObjects.Container
     * @param {Scene} scene - escena a la que pertenece (UIManager)
     * @param {Phone} phone - telefono
     * @param {String} bgImage - id de la imagen de fondo
     * @param {BaseScreen} prevScreen - pantalla anterior
     */
    constructor(scene, phone, bgImage, prevScreen) {
        super(scene, 0, 0);
        this.scene = scene;
        this.phone = phone;

        this.gameManager = GameManager.getInstance();
        this.translatorManager = TranslatorManager.getInstance();
        
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