import GameManager from './gameManager.js';
import Phone from '../UI/phone/phone.js';

export default class PhoneManager {
    /**
    * Gestor del telefono. Se encarga de mostrar/ocultar el telefono y contiene el telefono en si.
    * Tambien gestiona las notificaciones y las animaciones de despertarse y quedarse dormido
    */
    constructor(scene) {
        this.scene = scene;
        this.gameManager = GameManager.getInstance();
        this.i18next = this.gameManager.i18next;
        this.dispatcher = this.gameManager.dispatcher;

        // Anade el telefono 
        this.phone = new Phone(scene, this);
        this.toggling = false;

        // Anade el icono del telefono
        this.createPhoneIcon();

        // Anade un rectangulo para bloquear la interaccion con los elementos del fondo
        this.bgBlock = scene.add.rectangle(0, 0, this.scene.CANVAS_WIDTH, this.scene.CANVAS_HEIGHT, 0xfff, 0).setOrigin(0, 0);
        this.bgBlock.setInteractive({ useHandCursor: true });
        this.bgBlock.setDepth(this.icon.depth - 3);

        // Si se pulsa fuera del telefono cuando esta sacado, se guarda
        this.bgBlock.on('pointerdown', () => {
            this.togglePhone(false);
            // TRACKER EVENT
            // console.log("Cerrando telefono");
            this.gameManager.sendItemInteraction("phone", {
                "Closing": true,
                "Method": "BlankArea"
            });
        });

        // Anade el icono de las notificaciones
        let notifObj = this.createNotificationsIcon(this.icon.x + this.icon.displayWidth * 0.3, this.icon.y - this.icon.displayHeight * 0.4);
        this.notifications = notifObj.container;
        this.notificationText = notifObj.text;
        this.notificationAmount = 0;

        this.setNotifications();
        this.activatePhone(false);
        this.activatePhoneIcon(false);
    }



    // Crea el icono
    createPhoneIcon() {
        // Configuracion de las posiciones y animaciones
        let OFFSET = 80;
        let ICON_SCALE = 0.4;

        // Anade el icono del telefono
        this.icon = this.scene.add.image(this.scene.CANVAS_WIDTH - OFFSET, this.scene.CANVAS_HEIGHT - OFFSET, 'phoneIcon').setScale(ICON_SCALE);
        this.icon.setInteractive({ useHandCursor: true });

        // Al pasar el raton por encima del icono, se hace mas grande,
        // al quitar el raton de encima vuelve a su tamano original,
        // y al hacer click, se hace pequeno y grande de nuevo
        this.icon.on('pointerover', () => {
            if (!this.scene.dialogManager.isTalking()) {
                this.scene.tweens.add({
                    targets: [this.icon],
                    scale: ICON_SCALE * 1.1,
                    duration: 0,
                    repeat: 0,
                });
            }
        });
        this.icon.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [this.icon],
                scale: ICON_SCALE,
                duration: 0,
                repeat: 0,
            });
        });
        this.icon.on('pointerdown', () => {
            // Si no hay dialogo actino ni animacion reproduciendose, se muestra/oculta el movil
            if (!this.scene.dialogManager.isTalking() && !this.toggling && this.scene.lidAnim == null) {
                if (this.phone.visible) {
                    // TRACKER EVENT
                    // console.log("Cerrando telefono");
                    this.gameManager.sendItemInteraction("phone", {
                        "Closing": true,
                        "Method": "PhoneIcon"
                    });
                }
                else {
                    // TRACKER EVENT
                    // console.log("Abriendo telefono");
                    this.gameManager.sendItemInteraction("phone", { "Closing": false });
                }

                this.togglePhone();

                this.scene.tweens.add({
                    targets: [this.icon],
                    scale: ICON_SCALE,
                    duration: 20,
                    repeat: 0,
                    yoyo: true
                });
            }
        });

    }

    activatePhoneIcon(active) {
        this.icon.visible = active;

        // Si son mas de 0, activa las notificaciones si el icono esta activo y cambia el texto
        if (this.notificationAmount > 0) {
            this.notifications.visible = this.icon.visible;
            this.notificationText.setText(this.notificationAmount);
        }
        // Si no, las desactiva
        else {
            this.notifications.visible = false;
            this.notificationText.setText("");
        }
    }

    /**
     * Crea el icono de las notificaciones
     * @param {Number} x - posicion x del icono 
     * @param {Number} y - posicion y del icono
     * @param {Boolean} circle - true si la forma del icono es circular, false si es rectangular
     * @returns {Object} - objeto con el contenedor y el objeto de texto
     */
    createNotificationsIcon(x, y) {
        let notificationColor = 0xFFFD6414
        let borderColor = 0x000;

        let fillImg = null;
        let edgeImg = null;

        let radius = 50;
        let borderThickness = 6;
        fillImg = this.scene.add.circle(0, 0, radius, notificationColor);
        edgeImg = this.scene.add.circle(0, 0, radius + borderThickness, borderColor);

        // Configuracion de texto para las notificaciones
        let notifTextConfig = { ...this.scene.gameManager.textConfig };
        notifTextConfig.fontFamily = 'roboto-regular';
        notifTextConfig.fontSize = 55 + 'px';
        notifTextConfig.fontStyle = 'bold';

        // Crea el texto con el numero de notificaciones
        let textObj = this.scene.add.text(0, 0, "", notifTextConfig).setOrigin(0.5, 0.5);

        // Crea el contenedor para todos los elementos y los anade 
        let notifications = this.scene.add.container(0, 0);
        notifications.add(fillImg);
        notifications.add(edgeImg);
        notifications.add(textObj);

        // Reordena los elementos
        notifications.bringToTop(edgeImg);
        notifications.bringToTop(fillImg);
        notifications.bringToTop(textObj);

        // Redimensiona el contenedor
        notifications.setScale(0.4);
        notifications.x = x;
        notifications.y = y;

        return {
            container: notifications,
            text: textObj
        };
    }

    /**
     * Anade notificaciones a las que ya habia
     * @param {Number} amount - cantidad de notificaciones que anadir a la cantidad actual 
     */
    addNotifications(amount) {
        this.notificationAmount += amount;
        this.setNotifications();
    }

    // Establece las notificaciones que hay
    setNotifications() {
        // Si son mas de 0, activa las notificaciones si el icono esta activo y cambia el texto
        if (this.notificationAmount > 0) {
            this.notifications.visible = this.icon.visible;
            this.notificationText.setText(this.notificationAmount);
        }
        // Si no, las desactiva
        else {
            this.notifications.visible = false;
            this.notificationText.setText("");
        }
    }


    /**
     * Reproduce la animacion de ocultar/mostrar el movil
     * @param {Number} speed - velolcidad a la que se reproduce la animacion (en ms) 
     */
    togglePhone(active, speed, onComplete) {
        if (active == null) {
            active = !this.phone.visible;
        }
        if (speed == null && speed !== 0) {
            speed = 100;
        }

        // Se indica que va a empezar una
        this.toggling = true;
        let anim = null;

        // Si el telefono es visible
        if (this.phone.visible && !active) {
            anim = this.scene.tweens.add({
                targets: [this.phone],
                alpha: { from: 1, to: 0 },
                duration: speed,
                repeat: 0,
            });

            // Una vez terminada la animacion, se oculta el telefono, se indica que ya ha terminado, se 
            // reactiva la interaccion con los elementos del fondo y vuelve a la pantalla de inicio
            anim.on('complete', () => {
                this.activatePhone(false);
                this.phone.toMessagesListScreen();

                this.toggling = false;
            });
        }
        // Si el telefono no es visible
        else if (!this.phone.visible && active) {
            this.activatePhone(true);

            // Se mueve hacia el centro de la pantalla
            anim = this.scene.tweens.add({
                targets: [this.phone],
                alpha: { from: 0, to: 1 },
                duration: speed,
                repeat: 0,
            });

            // Una vez terminada la animacion, se indica que ya ha terminado
            anim.on('complete', () => {
                this.toggling = false;
                this.phone.toMessagesListScreen();
            });
        }
        else {
            this.toggling = false;
        }
        if (anim != null) {
            anim.on('complete', () => {
                if (onComplete !== null && typeof onComplete === 'function') {
                    onComplete();
                }
            });
        }
    }

    activatePhone(active) {
        this.phone.visible = active;
        this.bgBlock.visible = active;
        if (active) {
            this.bgBlock.setInteractive();
        }
        else {
            this.bgBlock.disableInteractive();
        }
    }
}