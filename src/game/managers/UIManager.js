import { Scene } from "phaser";
import GameManager from "./gameManager";
import DialogManager from "./dialogManager";
import PhoneManager from "./phoneManager";

export default class UIManager extends Scene {
    /**
    * Gestor de la interfaz. Contiene el PhoneManager y el DialogManager.
    * Tambien se encarga de la creacion de textos
    * @extends Scene
    */
    constructor(scene) {
        super({ key: 'UIManager' });
    }

    create() {
        this.CANVAS_WIDTH = this.sys.game.canvas.width
        this.CANVAS_HEIGHT = this.sys.game.canvas.height;

        this.gameManager = GameManager.getInstance();
        this.phoneManager = new PhoneManager(this);
        this.dialogManager = new DialogManager(this);

        // Crea los parpados para la animacion de abrir y cerrar los ojos
        this.topLid = this.add.rectangle(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT / 2, 0x000, 1).setOrigin(0, 0);
        this.topLid.setDepth(100).setScrollFactor(0);
        this.botLid = this.add.rectangle(0, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH, this.CANVAS_HEIGHT / 2, 0x000, 1).setOrigin(0, 0);
        this.botLid.setDepth(100).setScrollFactor(0);

        this.topLid.setInteractive();
        this.botLid.setInteractive();

        this.moveLids(true);
        this.lidAnim = null;
    }

    // Animacion de abrir los ojos
    openEyes(onComplete) {
        this.phoneManager.togglePhone(false);

        this.moveLids(false);
        let speed = 1000;
        let lastTopPos = this.topLid.y;
        let lastBotPos = this.botLid.y;
        let movement = this.topLid.displayHeight / 4;

        // Abre los ojos
        this.lidAnim = this.tweens.add({
            targets: [this.topLid],
            y: { from: lastTopPos, to: lastTopPos - movement },
            duration: speed,
            repeat: 0,
        });
        this.tweens.add({
            targets: [this.botLid],
            y: { from: lastBotPos, to: lastBotPos + movement },
            duration: speed,
            repeat: 0,
        });

        // Cierra un poco los ojos
        this.lidAnim.on('complete', () => {
            speed = 500
            lastTopPos = this.topLid.y;
            lastBotPos = this.botLid.y;
            movement = this.topLid.displayHeight / 10;

            this.lidAnim = this.tweens.add({
                targets: [this.topLid],
                y: { from: lastTopPos, to: lastTopPos + movement },
                duration: speed,
                repeat: 0,
            });
            this.tweens.add({
                targets: [this.botLid],
                y: { from: lastBotPos, to: lastBotPos - movement },
                duration: speed,
                repeat: 0,
            });

            // Vuelve a abrir los ojos
            this.lidAnim.on('complete', () => {
                speed = 500
                lastTopPos = this.topLid.y;
                lastBotPos = this.botLid.y;
                movement = this.topLid.displayHeight / 9;

                this.lidAnim = this.tweens.add({
                    targets: [this.topLid],
                    y: { from: lastTopPos, to: lastTopPos - movement },
                    duration: speed,
                    repeat: 0,
                });
                this.tweens.add({
                    targets: [this.botLid],
                    y: { from: lastBotPos, to: lastBotPos + movement },
                    duration: speed,
                    repeat: 0,
                });

                // Cierra los ojos un poco mas
                this.lidAnim.on('complete', () => {
                    speed = 500
                    lastTopPos = this.topLid.y;
                    lastBotPos = this.botLid.y;
                    movement = this.topLid.displayHeight / 5;

                    this.lidAnim = this.tweens.add({
                        targets: [this.topLid],
                        y: { from: lastTopPos, to: lastTopPos + movement },
                        duration: speed,
                        repeat: 0,
                    });
                    this.tweens.add({
                        targets: [this.botLid],
                        y: { from: lastBotPos, to: lastBotPos - movement },
                        duration: speed,
                        repeat: 0,
                    });

                    // Abre los ojos completamente
                    this.lidAnim.on('complete', () => {
                        speed = 1500
                        lastTopPos = this.topLid.y;
                        lastBotPos = this.botLid.y;

                        this.lidAnim = this.tweens.add({
                            targets: [this.topLid],
                            y: { from: lastTopPos, to: -this.CANVAS_HEIGHT / 2 },
                            duration: speed,
                            repeat: 0,
                        });
                        this.tweens.add({
                            targets: [this.botLid],
                            y: { from: lastBotPos, to: this.CANVAS_HEIGHT },
                            duration: speed,
                            repeat: 0,
                        });

                        this.lidAnim.on('complete', () => {
                            if (onComplete !== null && typeof onComplete === 'function') {
                                onComplete();
                            }
                            this.lidAnim = null;
                        });
                    });
                });
            });
        });
    }

    // Animacion de cerrar los ojos. Cierra los parpados y 
    // vuelve a reproducir la animacion de abrir los ojos
    closeEyes(onComplete) {
        this.phoneManager.togglePhone(false);

        this.moveLids(true);
        let speed = 2000;
        let lastTopPos = this.topLid.y;
        let lastBotPos = this.botLid.y;

        this.lidAnim = this.tweens.add({
            targets: [this.topLid],
            y: { from: lastTopPos, to: 0 },
            duration: speed,
            repeat: 0,
        });
        this.tweens.add({
            targets: [this.botLid],
            y: { from: lastBotPos, to: this.CANVAS_HEIGHT / 2 },
            duration: speed,
            repeat: 0,
        });

        this.lidAnim.on('complete', () => {
            if (onComplete !== null && typeof onComplete === 'function') {
                onComplete();
            }
            this.lidAnim = null;
        });
    }

    moveLids(opened) {
        if (!opened) {
            this.topLid.y = 0;
            this.botLid.y = this.CANVAS_HEIGHT / 2;
        }
        else {
            this.topLid.y = -this.CANVAS_HEIGHT / 2;
            this.botLid.y = this.CANVAS_HEIGHT;
        }
    }
}