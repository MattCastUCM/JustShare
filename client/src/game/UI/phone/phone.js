import { Image, GameObjects } from "phaser";
import MessagesScreen from "./messagesScreen";

export default class Phone extends GameObjects.Container {
    constructor(scene, phoneManager) {
        super(scene, 0, 0);
        this.scene = scene;
        this.phoneManager = phoneManager;

        // Se crean las imagenes y diferentes pantallas
        this.phone = scene.add.image(scene.CANVAS_WIDTH / 2, scene.CANVAS_HEIGHT / 2, 'phone');

        let RETURN_BUTTON_X = 702;
        let RETURN_BUTTON_Y = 839;
        this.returnButton = scene.add.image(RETURN_BUTTON_X, RETURN_BUTTON_Y, 'returnButton');
        this.animateButton(this.returnButton, () => {
            this.toPrevScreen();
        })

        this.messagesScreen = null;

        // Se anade la imagen del telefono y las pantallas a la escena
        this.add(this.phone);
        this.add(this.returnButton);

        // Se crea el mapa que guardara las pantallas de chat
        this.chats = new Map();

        this.reset();
        scene.add.existing(this);
    }

    reset() {
        if (this.messagesScreen != null) {
            this.messagesScreen.destroy();
        }
        this.chats.forEach((chat) => {
            chat.setNode(null);
            chat.destroy();
        });
        this.chats.clear();

        this.messagesScreen = new MessagesScreen(this.scene, this, null);
        this.add(this.messagesScreen);

        // Se pone la imagen del telefono por encima de todo
        this.sendToBack(this.messagesScreen);
        this.bringToTop(this.phone);
        this.bringToTop(this.returnButton);

        this.currScreen = this.messagesScreen;
    }

    /**
     * Anade al boton la animacion y la funcion a la que debe llamar
     * @param {Image} button - imagen que animar
     * @param {Function} onClick - funcion a la que llama el boton al pulsarlo
     */
    animateButton(button, onClick) {
        // Se hace interactivo
        button.setInteractive({ useHandCursor: true });
        let originalScale = button.scale

        // Al pasar el raton por encima, el icono se hace mas grande,
        // y al sacarlo, el icono vuelve a su escala original
        button.on('pointerover', () => {
            this.scene.tweens.add({
                targets: [button],
                scale: originalScale * 1.3,
                duration: 0,
                repeat: 0,
            });
        });
        button.on('pointerout', () => {
            this.scene.tweens.add({
                targets: [button],
                scale: originalScale,
                duration: 0,
                repeat: 0,
            });
        });

        // Al hacer click, se hace mas pequeno y vuelve a 
        // ponerse como estaba originalmente (efecto yoyo)
        button.on('pointerdown', () => {
            let anim = this.scene.tweens.add({
                targets: [button],
                scale: originalScale,
                duration: 20,
                repeat: 0,
                yoyo: true
            });

            // Si la funcion onClick es valida y se ha hecho la 
            // animacion, al terminar la animacion llama a la funcion
            if (anim && onClick !== null && typeof onClick === 'function') {
                anim.on('complete', () => {
                    onClick();
                });
            }
        });
    }


    /**
     * Cambia a la pantalla indicada
     * @param {BaseScreen} nextScreen - pantalla a la que se va a cambiar
     */
    changeScreen(nextScreen) {
        // Si la pantalla actual no es la misma que la siguiente
        if (this.currScreen !== nextScreen) {
            // Si hay una pantalla actual, la oculta
            if (this.currScreen) {
                this.currScreen.visible = false;
            }

            // Hace que la pantalla actual sea a la que se va a cambiar
            this.currScreen = nextScreen;

            // Muestra la pantalla actual
            this.currScreen.visible = true;
        }
    }

    // Pasa a la pantalla anterior
    toPrevScreen(fromChatButton = false) {
        // Si la pantalla actual es la pantalla principal, se guarda el movil
        if (this.currScreen === this.messagesScreen || !this.currScreen.prevScreen) {
            this.phoneManager.togglePhone();

            // TRACKER EVENT
            // console.log("Cerrando telefono");
            // this.scene.gameManager.sendItemInteraction("phone", {
            //     "Closing": true,
            //     "Method": "PhoneReturnButton"
            // });
            this.scene.trackerManager.sendItemInteraction("phone", {
                "Closing": true,
                "Method": "PhoneReturnButton"
            });
        }
        // Si no, si la pantalla actual tiene pantalla anterior, se cambia a esa pantalla
        else if (this.currScreen.prevScreen) {
            this.changeScreen(this.currScreen.prevScreen);

            // TRACKER EVENT
            // console.log("Salir del chat:", this.name);
            // this.scene.gameManager.sendExitChat(fromChatButton);
            this.scene.trackerManager.sendExitChat(fromChatButton);
        }
    }

    toMessagesListScreen() {
        this.changeScreen(this.messagesScreen);
    }


    /**
     * Cambia a la pantalla del chat indicado
     * @param {String} chat - id del chat
     */
    toChatScreen(chat) {
        if (this.chats.has(chat)) {
            this.changeScreen(this.chats.get(chat));
            this.chats.get(chat).clearNotifications();
        }
    }

    /**
     * Muestra en la pantalla de mensajes el chat indicado
     * @param {String} name - nombre del contacto
     * @param {String} icon - id de la imagen con la foto de perfil del contacto
     *                          Nota: la id del personaje corresponde con su icono
     */
    addChat(name, icon) {
        if (!this.chats.has(name)) {
            this.messagesScreen.addChat(name, icon);
            this.bringToTop(this.phone);
            this.bringToTop(this.returnButton);
        }
    }

    /**
     * Cambia el nodo de dialogo en el chat indicado
     * 
     * IMPORTANTE: Antes de poder llamar a este metodo, se tiene que haber
     * llamado al metodo addChat para que chatScreen tenga el metodo setNode
     * 
     * @param {String} chat - id del chat en el que anadir el mensaje 
     * @param {DialogNode} node - nodo de dialogo que se va a reproducir
     */
    setChatNode(chat, node) {
        if (this.chats.has(chat)) {
            this.chats.get(chat).setNode(node);
        }
    }

    /**
     * Procesa el nodo del chat indicado
     * @param {String} chat - id del chat en el que anadir el mensaje 
     */
    processChatNode(chat) {
        if (this.chats.has(chat)) {
            this.chats.get(chat).processNode();
        }
    }
}