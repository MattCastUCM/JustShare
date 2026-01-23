import { Scene } from "phaser";
import WebFont from "webfontloader";

export default class Boot extends Scene {
    /**
    * Escena en la que se cargan los recursos de la barra de carga
    * @extends Scene
    */
    constructor() {
        super("Boot")
    }

    preload() {
        this.load.setPath('assets/computer');
        this.load.image('loadscreen', 'loadscreen.png');
    }

    create() {
        const fontFamilies = ["roboto-regular", "corpid", "corpid-black"]

        WebFont.load({
            custom: {
                families: fontFamilies
            },
            active: () => {
                this.scene.start("Preloader");
            },
            inactive: () => {
                console.error("Error loading fonts.");
                this.scene.start("Preloader");
            }
        });
    }
}