import BaseScreen from "./baseScreen.js";
import VerticalListView from "../listView/verticalListView.js";
import MessageBox from "../messageBox.js";

export default class ChatScreen extends BaseScreen {
    /**
     * Pantalla base para los chats. Tiene metodos para actualizar
     * el numero de notificaciones del telefono en base a las
     * notificaciones que haya en el chat
     * @extends BaseScreen
     * @param {Phaser.Scene} scene - escena a la que pertenece (UIManager)
     * @param {Phone} phone - telefono
     * @param {BaseScreen} prevScreen - pantalla anterior
     * @param {String} name - nombre del contacto
     * @param {String} icon - icono del contacto
     *                          Nota: el id del personaje corresponde con su icono
     */
    constructor(scene, phone, prevScreen, name, icon) {
        super(scene, phone, 'chatBg', prevScreen);

        this.HEADER_X = 640;
        this.HEADER_Y = 107;

        // Configuracion de las animaciones
        this.tintFadeTime = 50;
        this.noTint = Phaser.Display.Color.HexStringToColor('#ffffff');
        this.pointerOverColor = Phaser.Display.Color.HexStringToColor('#9c9edf');

        // Crea la caja de respuesta y el boton de volver hacia atras y los guarda
        // en las variables this.textBox y this.returnButton respectivamente
        this.createTextBox();
        this.createReturnButton();

        // Configuracion de texto para la el texto del titulo
        let textConfig = { ...scene.gameManager.textConfig };
        textConfig.fontFamily = 'roboto-regular';
        textConfig.color = '#000';
        textConfig.fontStyle = 'bold';

        let nameTextOffsetX = 90;
        // Crea el texto del nombre de la persona
        this.name = name;
        this.nameText = this.scene.add.text(this.HEADER_X + nameTextOffsetX, this.HEADER_Y, name, textConfig).setOrigin(0, 0.5);

        // Crea el icono
        // this.iconImage = this.scene.add.image(this.nameText.x, this.nameText.y, 'avatars', icon);
        this.iconImage = this.scene.add.image(this.nameText.x, this.nameText.y, icon);
        this.iconImage.setScale((this.nameText.displayHeight / this.iconImage.displayHeight) * 2);
        this.iconImage.x -= this.iconImage.displayWidth * 0.7;

        // Icono de las notificaciones y cantidad de notificaciones
        this.notifications = null;
        this.notificationAmount = 0;

        // Nodo de texto que se reproducira al pulsar el boton de erespuesta
        this.currNode = null;

        // Lista con los mensajes
        this.messagesListView = new VerticalListView(this.scene, this.BG_X, 142,
            1, -40, { width: this.bg.displayWidth * 0.85, height: 605 }, null, true, 50, true);

        this.add(this.nameText);
        this.add(this.iconImage);
        this.add(this.messagesListView);


        // Deja los mensajes debajo por si acaso
        this.bringToTop(this.messagesListView);
        this.bringToTop(this.textBox);
        this.bringToTop(this.returnButton);
        this.bringToTop(this.nameText);
        this.bringToTop(this.iconImage);

        this.canAnswer = false;
        this.boxClickable = false;
    }


    // Crea la caja de respuesta y la guarda en la variable this.textBox
    createTextBox() {
        let TEXT_BOX_Y = 770;

        // Anade la imagen de la caja
        this.textBox = this.scene.add.image(this.BG_X, TEXT_BOX_Y, 'chatTextBox');
        this.textBox.setInteractive({ useHandCursor: true });

        // Hace fade del color de la caja al pasar o quitar el raton por encima
        this.textBox.on('pointerover', () => {
            if (!this.scene.dialogManager.isTalking() && this.boxClickable) {
                if (this.canAnswerAnim != null) {
                    this.scene.tweens.remove(this.canAnswerAnim);
                    this.canAnswerAnim = null;
                }

                this.scene.tweens.addCounter({
                    targets: [this.textBox],
                    from: 0,
                    to: 100,
                    onUpdate: (tween) => {
                        const value = tween.getValue();
                        let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.noTint, this.pointerOverColor, 100, value);
                        let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                        this.textBox.setTint(colInt);
                    },
                    duration: this.tintFadeTime,
                    repeat: 0,
                });
            }

        });
        this.textBox.on('pointerout', () => {
            if (!this.scene.dialogManager.isTalking() && this.boxClickable) {
                let anim = this.scene.tweens.addCounter({
                    targets: [this.textBox],
                    from: 0,
                    to: 100,
                    onUpdate: (tween) => {
                        const value = tween.getValue();
                        let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.pointerOverColor, this.noTint, 100, value);
                        let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                        this.textBox.setTint(colInt);
                    },
                    duration: this.tintFadeTime,
                    repeat: 0,
                });

                // Al poner el color normal, vuelve a poner la animacion para indicar que se puede responder
                anim.on('complete', () => {
                    this.setInteractive();
                });
            }
        });

        // Al hacer click, vuelve a cambiar el color de la caja al original
        this.textBox.on('pointerdown', () => {
            if (!this.scene.dialogManager.isTalking()) {
                // TRACKER EVENT
                // console.log("Pulsar boton de responder:", this.name);
                this.gameManager.sendItemInteraction("phoneAnswerButton");

                if (this.boxClickable) {
                    this.disableInteractive();

                    let fadeColor = this.scene.tweens.addCounter({
                        targets: [this.textBox],
                        from: 0,
                        to: 100,
                        onUpdate: (tween) => {
                            const value = tween.getValue();
                            let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.noTint, this.pointerOverColor, 100, value);
                            let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                            this.textBox.setTint(colInt);
                        },
                        duration: this.tintFadeTime,
                        repeat: 0,
                        yoyo: true
                    });

                    // Si se ha hecho la animacion, al terminar la animacion hace que
                    // el dialogManager cree las opciones para responder y las active
                    if (fadeColor != null && this.currNode) {
                        fadeColor.on('complete', () => {
                            // TRACKER EVENT
                            // console.log("Responder mensaje respondible:", this.name);
                            this.gameManager.sendAnsweredChat(this.currNode.fullId, this.name);

                            // Si es un mensaje de chat, lo procesa
                            if (this.currNode.type === "chatMessage") {
                                this.processNode();
                            }
                            // Si no, lo procesa el dialogManager
                            else {
                                this.scene.dialogManager.currNode = null;
                                this.scene.dialogManager.setNode(this.currNode, []);
                                this.setNode(null);
                            }
                        });
                    }
                }

            }

        });

        this.add(this.textBox);
    }

    // Crea el boton de volver atras y lo guarda en la variable this.returnButton
    createReturnButton() {
        // Anade la imagen del boton
        this.returnButton = this.scene.add.image(this.HEADER_X, this.HEADER_Y, 'chatReturnButton');
        this.returnButton.setInteractive();

        let originalScale = this.returnButton.scale;

        // Al pasar el raton por encima del icono, se hace mas grande,
        // al quitar el raton de encima vuelve a su tamano original,
        // y al hacer click, se hace pequeno y grande de nuevo
        this.returnButton.on('pointerover', () => {
            if (!this.scene.dialogManager.isTalking()) {
                this.scene.tweens.add({
                    targets: [this.returnButton],
                    scale: originalScale * 1.2,
                    duration: 0,
                    repeat: 0,
                });

            }
        });
        this.returnButton.on('pointerout', () => {
            if (!this.scene.dialogManager.isTalking()) {
                this.scene.tweens.add({
                    targets: [this.returnButton],
                    scale: originalScale,
                    duration: 0,
                    repeat: 0,
                });
            }

        });
        this.returnButton.on('pointerdown', () => {
            if (!this.scene.dialogManager.isTalking()) {
                let anim = this.scene.tweens.add({
                    targets: [this.returnButton],
                    scale: originalScale,
                    duration: 20,
                    repeat: 0,
                    yoyo: true
                });

                // Cuando termina la animacion, vuelve a la pantalla anterior
                anim.on('complete', () => {
                    this.phone.toPrevScreen(true);
                });
            }

        });

        this.add(this.returnButton);
    }

    // Anade una animacion a la caja de respuesta para saber que se puede escribir
    setInteractive() {
        if (this.canAnswerAnim == null) {
            this.canAnswerAnim = this.scene.tweens.addCounter({
                targets: [this.textBox],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.noTint, this.pointerOverColor, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                    this.textBox.setTint(colInt);
                },
                duration: this.tintFadeTime * 15,
                repeat: -1,
                yoyo: true
            });
        }

        // this.textBox.setInteractive();
        this.canAnswer = true;
        this.boxClickable = true;
    }

    disableInteractive() {
        // Elimina la animacion de que se podia hacer click en la caja
        // this.textBox.disableInteractive();

        if (this.canAnswerAnim != null) {
            this.scene.tweens.remove(this.canAnswerAnim);
            this.canAnswerAnim = null;
            this.textBox.setTint('0xffffff');
        }
        this.canAnswer = false;
        this.boxClickable = false;
    }

    /**
     * Cambia el nodo de dialogo
     * @param {DialogNode} node - nodo de dialogo que se va a reproducir
     */
    setNode(node) {
        this.canAnswer = true;

        // Si el nodo a poner es valido, cambia el nodo por el indicado
        if (node != null) {
            this.currNode = node;
            this.processNode();
        }
        else {
            this.disableInteractive();

        }
    }

    // Procesa el nodo de dialogo
    processNode() {
        if (this.currNode) {
            this.disableInteractive();

            let delay = 0;
            if (this.currNode.nextDelay == null) {
                delay = this.currNode.nextDelay;
            }
            // Si el nodo es de tipo mensaje, con el retardo indicado, anade
            //  el mensaje al chat, pasa al siguiente nodo, y lo procesa.
            if (this.currNode.type === "chatMessage") {
                this.canAnswer = false;
                setTimeout(() => {
                    this.addMessage(this.currNode.text, this.currNode.character, this.currNode.name);
                    this.currNode = this.currNode.next[0];
                    this.processNextNode(delay);
                }, this.currNode.replyDelay);
            }
            // Si el nodo es de tipo condicion, hace que el dialogManager lo procese y obtiene el siguiente nodo
            else if (this.currNode.type === "condition") {
                let i = this.scene.dialogManager.processConditionNode(this.currNode);
                this.scene.dialogManager.currNode = this.currNode;

                // El indice del siguiente nodo sera el primero que cumpla una de las condiciones
                this.currNode = this.currNode.next[i];

                // Pasa al siguiente nodo
                this.processNextNode(delay);
            }
            // Si el nodo es de tipo evento, hace que el dialogManager lo procese y pasa al siguiente nodo
            else if (this.currNode.type === "event") {
                this.scene.dialogManager.processEventNode(this.currNode);

                // IMPORTANTE: DESPUES DE UN NODO DE EVENTO SOLO HAY UN NODO, POR LO QUE 
                // EL SIGUIENTE NODO SERA EL PRIMER NODO DEL ARRAY DE NODOS SIGUIENTES
                this.currNode = this.currNode.next[0];
                this.processNextNode(delay);
            }
            else if (this.currNode.type === "text") {
                this.scene.dialogManager.currNode = this.currNode;
                this.setInteractive();

                // TRACKER EVENT
                // console.log("Mensaje respondible en chat:", this.name);
                this.gameManager.sendCanAnswerChat(this.currNode.fullId, this.name);
            }
            else {
                this.setInteractive();

                // TRACKER EVENT
                // console.log("Mensaje respondible en chat:", this.name);
                this.gameManager.sendCanAnswerChat(this.currNode.fullId, this.name);
            }
        }
    }

    processNextNode(delay) {
        setTimeout(() => {
            this.processNode();
        }, delay);
    }


    /**
     * Anade el mensaje a la listView de mensajes
     * @param {String} text - texto del mensaje
     * @param {String} character - id del personaje que envia el mensaje
     * @param {String} name - nombre del personaje que envia el mensaje
     */
    addMessage(text, character, name) {
        // Si la pantalla actual no es la del chat y no es el jugador quien escribe, se genera una notificacion
        if (this.phone.currScreen !== this && character !== "player") {
            this.generateNotifications(1);
        }

        // Crea la caja del mensaje y la anade a la lista
        let msg = new MessageBox(this.scene, text, character, name, 0, this.bg.displayWidth);
        this.messagesListView.addLastItem(msg);
    }

    // Borra todas las notificaciones de este chat
    // (genera -notificationAmount para quitarlas todas)
    clearNotifications() {
        this.generateNotifications(-this.notificationAmount);
    }

    /**
     * Genera notificaciones para el chat
     * @param {Number} amount - cantidad de notificaciones a generar 
     */
    generateNotifications(amount) {
        // Actualiza la cantidad de notificaciones tanto del chat, como en general
        this.notificationAmount += amount;
        this.phone.phoneManager.addNotifications(amount);

        // Si ya no hay notificaciones, se oculta el icono
        if (this.notificationAmount === 0) {
            if (this.notifications.container.visible) {
                // TRACKER EVENT
                // console.log("Limpiar notificaciones de:", this.name)
                this.gameManager.sendNotificationsCleared(this.name);
            }

            this.notifications.container.visible = false;
        }
        // Si hay notificaciones, se muestra el icono y actualiza el texto
        else {
            if (!this.notifications.container.visible) {
                // TRACKER EVENT
                // console.log("Recibir notificacion de:", this.name)
                this.gameManager.sendNotificationReceived(this.name);
            }

            this.notifications.container.visible = true;
            this.notifications.text.setText(this.notificationAmount);
        }
    }
}