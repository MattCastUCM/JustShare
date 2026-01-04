import BaseScene from '../baseScene.js';
import Portrait from '../../../UI/dialog/portrait.js';

export default class Scene3Break extends BaseScene {
    /**
     * @extends BaseScene
     * @param {String} name - id de la escena
     */
    constructor(name) {
        super("Scene3Break", 'Scene3Break');
    }

    create(params) {
        super.create(params)

        // Pone la imagen de fondo con las dimensiones del canvas
        let bg = this.add.image(0, 0, 'canteenBg').setOrigin(0, 0);
        this.scale = this.CANVAS_HEIGHT / bg.height;
        bg.setScale(this.scale);

        // Retrato de laura
        let lauraTr = this.portraitTr;
        lauraTr.x = this.CANVAS_WIDTH / 2;
        let lauraPortrait = new Portrait(this, "laura", lauraTr, "laura")
        lauraPortrait.setFlipX(true);
        this.portraits.set("laura", lauraPortrait);

        // Lee el archivo de nodos
        let nodes = this.cache.json.get('scene3Break');
        let node = super.readNodes(nodes, "scene3\\scene3Break", "conversation1", true);
        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });


        // Callback que al llamarse cambiara el nodo de dialogo
        this.setNode = () => {
            this.dialogManager.setNode(node, [lauraPortrait]);
        }

        this.chatName = this.gameManager.translate("textMessages.chat2", { ns: "deviceInfo", returnObjects: true });
        let phoneNode = super.readNodes(nodes, "scene3\\scene3Break", "fill", true);
        this.dialogManager.setNode(phoneNode, []);

        // Ajusta las posiciones de la caja de texto para que esten por debajo del movil (solo en esta escena)
        let textboxDepth = this.dialogManager.textbox.box.depth;
        let bgBlockDepth = this.dialogManager.bgBlock.depth;
        let iconDepth = this.phoneManager.icon.depth;
        this.dialogManager.textbox.setDepth(this.phoneManager.phone.depth - 2);
        this.dialogManager.bgBlock.setDepth(this.phoneManager.bgBlock.depth - 2);
        this.phoneManager.icon.setDepth(this.dialogManager.bgBlock.depth - 1);


        // Al producirse, se abre el telefono, se desactiva el bloqueo de fondo y el boton de 
        // volver atras (para no poder cerrarlo) y va directo a la pantalla del chat del acosador)
        this.dispatcher.add("answerPhone", this, () => {
            this.phoneManager.icon.disableInteractive();

            this.phoneManager.togglePhone(true, 100, () => {
                this.phoneManager.phone.toChatScreen(this.chatName);
            });
            this.phoneManager.bgBlock.disableInteractive();
            this.phoneManager.phone.returnButton.disableInteractive();
            this.phoneManager.phone.chats.get(this.chatName).returnButton.disableInteractive();
        });

        // Cuando llegan los eventos de enviar mensajes, se anade el mensaje correspondiente a la pantalla del chat
        this.dispatcher.add("sendMsg1", this, () => {
            this.sendMsg(nodes, "1");
        });
        this.dispatcher.add("sendMsg2", this, () => {
            this.sendMsg(nodes, "2");
        });
        // Cuando llega el ultimo mensaje, se hace tambien que la caja de texto desaparezca
        this.dispatcher.add("sendMsg3", this, () => {
            this.sendMsg(nodes, "3");

            setTimeout(() => {
                this.dialogManager.textbox.activate(false);
            }, 1000);
        });

        // TRACKER EVENT
        // console.log("Responder al telefono");   
        this.dispatcher.add("msg1Sent", this, () => {
            this.gameManager.sendAnswerFriend(0);
        });
        this.dispatcher.add("msg2Sent", this, () => {
            this.gameManager.sendAnswerFriend(1);

        });
        this.dispatcher.add("msg3Sent", this, () => {
            this.gameManager.sendAnswerFriend(2);

        });

        this.dispatcher.add("closePhone", this, () => {
            this.phoneManager.icon.setInteractive();

            this.phoneManager.toggling = false;
            this.phoneManager.togglePhone(false);

            node = super.readNodes(nodes, "scene3\\scene3Break", "conversation2", true);
            this.dialogManager.setNode(node, [lauraPortrait], false);
        });

        // Al producirse, se cambia a la escena de transicion y luego a la de la habitacion
        this.dispatcher.add("endBreak", this, () => {
            // Se vuelve a poner la caja de texto a la profundidad original
            this.dialogManager.textbox.setDepth(textboxDepth + 1);
            this.dialogManager.bgBlock.setDepth(bgBlockDepth + 1);
            this.phoneManager.icon.setDepth(iconDepth);
            this.phoneManager.phone.returnButton.setInteractive();

            let params = {
                text: this.gameManager.translate("scene3.classEnd", { ns: "transitions", returnObjects: true }),
                onComplete: () => {
                    this.gameManager.changeScene("Scene3Bedroom");
                },
            };
            this.gameManager.changeScene("TextOnlyScene", params);
        });
    }

    // Se hace esto porque si se establece un dialogo en la constructora, no funciona el bloqueo del fondo del DialogManager
    onCreate() {
        setTimeout(() => {
            this.setNode();
        }, 500);

        // Quitar notificaciones de los mensajes anteriores
        this.phoneManager.phone.toChatScreen(this.chatName);
        setTimeout(() => {
            this.phoneManager.phone.toMessagesListScreen();
        }, 50);
    }

    sendMsg(nodes, msg) {
        let nodeName = "phone" + msg;
        let phoneNode = super.readNodes(nodes, "scene3\\scene3Break", nodeName, true);

        this.phoneManager.phone.addChat(this.chatName, "harasserPfp");
        this.phoneManager.phone.setChatNode(this.chatName, phoneNode);
    }
}
