import { Scene } from "phaser";

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
        this.scene.start("Preloader")
    }
}