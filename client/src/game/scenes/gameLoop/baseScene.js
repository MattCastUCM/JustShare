import { Scene } from "phaser";
import { DialogNode, TextNode, ChoiceNode, ConditionNode, EventNode, ChatNode, CommentaryNode, SimilarityNode } from '../../UI/dialog/dialogNode';
import GameManager from '../../managers/gameManager';
import SceneManager from "../../managers/sceneManager";
import TrackerManager from "../../managers/trackerManager";
import EventDispatcher from "../../managers/eventDispatcher";
import TranslatorManager from "../../managers/translatorManager";

export default class BaseScene extends Scene {
    /**
     * Escena base para las escenas del juego. Guarda parametros como las dimensiones
     * del canvas o los managers y posiciones de los retratos de los personajes
     * @extends Phaser.Scene
     * @param {String} name - id de la escena
     * @param {String} atlasName - nombre del atlas que se utiliza en esta escena
     */
    constructor(name, atlasName) {
        super({ key: name });

        this.atlasName = atlasName;
    }

    create(params) {
        this.CANVAS_WIDTH = this.sys.game.canvas.width;
        this.CANVAS_HEIGHT = this.sys.game.canvas.height;
        // Obtiene el dialogManager (tendria que haberse iniciado antes que la escena)
        this.gameManager = GameManager.getInstance();

        this.UIManager = this.gameManager.UIManager;
        this.dialogManager = this.UIManager.dialogManager;
        this.phoneManager = this.UIManager.phoneManager;
        this.computer = this.gameManager.computer

        this.dispatcher = EventDispatcher.getInstance();
        this.sceneManager = SceneManager.getInstance();
        this.trackerManager = TrackerManager.getInstance();
        this.translatorManager = TranslatorManager.getInstance();

        // Crea el mapa para los retratos de los personajes
        this.portraits = new Map();
        this.PORTRAIT_X = this.CANVAS_WIDTH / 4;
        this.PORTRAIT_Y = this.CANVAS_HEIGHT / 1.5;
        this.PORTRAIT_SCALE = 0.7;

        // Transform del retrato con posicion y escala
        this.portraitTr = {
            x: this.PORTRAIT_X,
            y: this.PORTRAIT_Y,
            scale: this.PORTRAIT_SCALE
        };

        // Blackboard de variables de la escena actual
        this.blackboard = new Map();

        this.scale = 1;

        this.playerName = this.gameManager.getUserInfo().name;
        this.context = this.gameManager.getUserInfo().player;
        this.harasser = this.gameManager.getUserInfo().harasser;

        // Se anaden funciones adicionales a las que se llamara al crear y reactivar
        // Se tiene que suscribir el onCreate al evento create porque la escena base
        // es la que se encarga de cambiar los portraits del DialogManager, por lo que
        // no se puede llamar antes de que se cree la escena hija porque no va a haber
        // portraits, y la escena hija no puede llamar al super al final de su create
        // porque necesita las variables de la clase padre
        this.events.once('create', () => {
            this.onCreate(params);
        }, this);
        this.events.on('wake', (scene, params) => {
            this.onWake(params);
        }, this);
    }


    /**
     * Metodo que se llama al terminar de crear la escena. Se encarga de llamar initialSetup
     * @param {Object} params - objeto con los parametros que pasarle a initialSetup
     */
    onCreate(params) {
        this.initialSetup(params);
    }

    /**
     * Metodo que se llama al despertar la escena. Se encarga de llamar initialSetup
     * @param {Object} params - objeto con los parametros que pasarle a initialSetup
     */
    onWake(params) {
        this.initialSetup(params);
        if (params.onWake) {
            params.onWake();
        }
    }

    // Metodo que se encarga de limpiar los eventos del dispatcher y de eliminar los retratos del UIManager
    // IMPORTANTE: Hay que llamar a este metodo antes de llamar al stop de la escena para evitar problemas al eliminar los retratos
    shutdown() {
        this.UIManager.dialogManager.clearScene();

        if (this.dispatcher) {
            this.dispatcher.removeAll();
        }
    }

    /**
     * Se encarga de configurar la escena con los parametros iniciales y
     * de anadir los retratos de la escena actual en el dialogManager
     * @param {Object} params - parametros que se le pasan a la configuracion inicial
     */
    initialSetup(params) {
        this.dialogManager.changeScene(this);
    }


    // Llama al metodo para leer todos los nodos y luego se encarga de conectarlos
    readNodes(file, namespace, objectName, getObjs) {
        let nodesMap = new Map();
        let root = this.readAllNodes("root", file, namespace, objectName, getObjs, nodesMap);

        // Recorre todos los nodos guardados en el mapa
        nodesMap.forEach((node) => {
            // Recorre el array de nodos siguientes leyendo sus ids
            for (let i = 0; i < node.next.length; i++) {
                // Obtiene el nodo del mapa a partir de su id y la reemplaza en el array
                let nextNode = nodesMap.get(node.next[i]);
                node.next[i] = nextNode;
            }
        });
        return root;
    }

    createTextNode(character, textTranslation, getObjs, nextNode = null, centered = null) {
        let node = new TextNode();
        // Obtiene la id del personaje y coge su nombre del archivo de nombres localizados
        node.character = character;
        node.name = this.translatorManager.translate(node.character, "names", {
            returnObjects: getObjs
        });

        // Obtiene si el texto esta centrado o no
        if (centered) {
            node.centered = centered;
        }

        // Obtiene los fragmentos del dialogo
        let texts = [];
        // Si el texto no esta dividido en fragmentos, se guarda directamente en el array de textos
        if (!Array.isArray(textTranslation)) {
            texts.push(textTranslation);
        }
        // Si no, se guarda cada fragmento del dialogo en el array
        else {
            for (let i = 0; i < textTranslation.length; i++) {
                texts.push(textTranslation[i]);
            }
        }

        // Se recorren todos los fragmentos de texto
        for (let i = 0; i < texts.length; i++) {
            // Se crea un dialogo con todo el texto a mostrar
            let split = {
                text: texts[i],
                name: node.name,
            }

            // Se separa el fragmento en caso de que el texto sea demasiado largo
            let dialogs = this.splitDialogs([split], character, node.centered);

            // Se concatenan los fragmentos obtenidos con los que ya habia en el nodo
            // (se tienen que concatenar, ya que splitDialogs devuelve un array, por
            // lo que hacer push a node.dialogs meteria los fragmentos en varios arrays)
            node.dialogs = node.dialogs.concat(dialogs);
        }
        node.currDialog = 0;

        // Si hay un nodo despues de este, se crea de manera y se
        // guarda la id de dicho nodo en el array de nodos siguientes
        if (nextNode) {
            node.next.push(nextNode.fullId);
        }

        return node;
    }

    /**
    * Va leyendo los nodos del json de manera recursiva (el archivo se lee una sola vez y se pasa el objeto obtenido como parametro)
    *
    * @param {String} id - id del nodo que se lee. El nodo inicial es root
    * @param {Object} file - objeto obtenido como resultado de leer el json
    * @param {String} namespace - nombre del archivo de localizacion del que se va a leer
    * @param {String} objectName - nombre del objeto en el que esta el dialogo, si es que el json contiene varios dialogos de distintos objetos
    * @param {Boolean} getObjs - si se quiere devolver el nodo leido como un objeto
    * @returns {DialogNode} - el nodo de dialogo que se ha procesado
    *
    *
    * IMPORTANTE: Este metodo tiene que llamarse una vez se han creado los retratos de los personajes,
    * ya que al momento de separar los textos que sean demasiado largos, es necesario saber si el personaje
    * es un personaje que va a tener retrato o no para usar el ancho de linea correcto
    *
    * IMPORTANTE 2: La estructura de nodos es comun a todos los idiomas y se tiene que guardar con anterioridad
    * al momento de crear la escena para luego pasarlo como parametro file. El archivo del que se van a leer las
    * traducciones es el que se pasa en el parametro namespace, y tiene que pasarse un string con el nombre del
    * archivo sin la extension .json
    *
    * IMPORTANTE 3: En un nodo con condiciones, cada condicion lleva a otro nodo distinto.
    * Al momento de llegar a un nodo condicion, el siguiente nodo sera el indicado como siguiente
    * en la primera condicion que se cumpla (se van comprobando en el orden en el que se han leido).
    * Cada condicion puede tener varios requisitos (variables), en cuyo caso, la condicion solo
    * se cumplira si todos sus requisitos se cumplen (operador &&. De momento no hay soporte para el operador || )
    *
    */
    readAllNodes(id, file, namespace, objectName, getObjs, nodesMap) {
        let fileObj = file;
        let translationId = id;

        // Si el dialogo esta dentro de algun objeto, se ajusta tanto el objeto
        // del json en el que buscar los nodos, como la id que utilizar para encontrar
        // la traduccion del nodo. Esto es porque la id del nodo debe coincidir tanto
        // en el json como en el archivo de traducciones, pero al estar dentro de un objeto
        // con (por ejemplo) nombre object, un nodo con la id name deberia buscarse en el
        // archivo de traducciones como object.name, pero la id de nodo seguiria siendo name
        if (objectName !== "") {
            fileObj = this.getObjFromName(file, objectName);
            translationId = objectName + "." + id;
        }

        // Si el nodo ya se habia leido, lo devuelve
        if (nodesMap.has(translationId)) {
            return nodesMap.get(translationId);
        }
        // Si no, si la id del nodo no existe, devuelve null
        else if (!fileObj[id]) {
            return null;
        };

        // Crea el nodo y guarda sus atributos (se estableceran en el nodo al final)
        let node = new DialogNode();
        let nodeId = id;
        let type = fileObj[id].type;

        // Guarda el nodo y sus atributos base en caso de que se intente acceder a el antes
        // de que se termine de crear completamente (por si varios nodos llevan a el)
        nodesMap.set(translationId, node);
        node.id = nodeId;
        node.fullId = translationId;

        // Si el nodo es de tipo condicion
        if (type === "condition") {
            node = new ConditionNode();

            // Se leen todas las condiciones. Cada condicion lleva a un nodo distinto y
            // en una condicion se pueden comprobar multiples variables
            for (let i = 0; i < fileObj[id].conditions.length; i++) {
                // Obtiene el nombre de las variables a comprobar (suprimiendo la propiedad next)
                let obj = Object.keys(fileObj[id].conditions[i]);
                let vars = obj.filter(key => key !== "next");

                let nodeConditions = [];

                // Recorre todas las variables obtenidas
                for (let j = 0; j < vars.length; j++) {
                    // Lee el nombre de la variable
                    let varName = vars[j];

                    // Obtiene el objeto que guarda las propiedades que tiene que cumplir la variable
                    let obj = fileObj[id].conditions[i][varName];

                    // Crea un objeto igual que obj, pero que tambien guarda su nombre
                    let condition = obj;
                    condition.key = varName

                    // Guarda el valor por defecto del objeto. Si no tiene
                    // la propiedad en el json, se pone a false por defecto
                    let defaultValue = false;
                    if (obj.default) {
                        defaultValue = obj.default;
                    }

                    // Si no se ha definido si la variable es global o si se ha definido que si lo es,
                    // la guarda en el gameManager con su valor por defecto (si no se ha guardado antes)
                    if (obj.global === undefined || obj.global === true) {
                        if (!this.gameManager.blackboard.has(varName)) {
                            this.gameManager.blackboard.set(varName, defaultValue);
                        }
                    }
                    // Si no, la guarda en la blackboard de la escena con su valor por defecto
                    // (si no se ha guardado antes) e indica que la blackboard en la que comprobar
                    // la variable es la de esta escena
                    else {
                        if (!this.blackboard.has(varName)) {
                            this.blackboard.set(varName, defaultValue);
                        }
                        condition.blackboard = this.blackboard;
                    }

                    // Lo mete en las variables del nodo
                    nodeConditions.push(condition);
                }

                // Se guardan las condiciones
                node.conditions.push(nodeConditions);

                // Si hay un nodo despues de este, se crea de manera y se
                // guarda la id de dicho nodo en el array de nodos siguientes
                if (fileObj[id].conditions[i].next) {
                    let nextNode = this.readAllNodes(fileObj[id].conditions[i].next, file, namespace, objectName, getObjs, nodesMap);
                    node.next.push(nextNode.fullId);
                }
            }
        }
        // Si el nodo es de tipo texto
        else if (type === "text") {
            let textTranslation = this.translatorManager.translate(translationId, namespace, {
                name: this.playerName,
                context: this.context,
                returnObjects: getObjs
            });

            // Si hay un nodo despues de este, se crea de manera y se
            // guarda la id de dicho nodo en el array de nodos siguientes
            let nextNode = null;
            if (fileObj[id].next) {
                nextNode = this.readAllNodes(fileObj[id].next, file, namespace, objectName, getObjs, nodesMap);
            }

            node = this.createTextNode(fileObj[id].character, textTranslation, getObjs, nextNode, fileObj[id].centered)
        }
        // Si el nodo es de tipo opcion multiple
        else if (type === "choice") {
            node = new ChoiceNode();

            // Se obtienen las opciones del archivo de textos traducidos
            let texts = this.translatorManager.translate(translationId, namespace, {
                name: this.playerName,
                context: this.context,
                returnObjects: getObjs
            });

            for (let i = 0; i < fileObj[id].choices.length; i++) {
                let repeat = false;
                if (fileObj[id].choices[i].repeat === undefined || fileObj[id].choices[i].repeat) {
                    repeat = true;
                }
                let choice = {
                    text: texts[i],
                    repeat: repeat
                }

                // Se guarda la eleccion y se crea de manera recursiva
                // el nodo siguiente que corresponde a elegir dicha opcion
                node.choices.push(choice);

                // Si hay un nodo despues de este, se crea de manera y se
                // guarda la id de dicho nodo en el array de nodos siguientes
                if (fileObj[id].choices[i].next) {
                    let nextNode = this.readAllNodes(fileObj[id].choices[i].next, file, namespace, objectName, getObjs, nodesMap);
                    node.next.push(nextNode.fullId);
                }
                else {
                    node.next.push({});
                }
            }
        }
        else if (type == "similarity") {
            node = new SimilarityNode();

            node.method = fileObj[id].method;
            node.threshold = fileObj[id].threshold;
            node.character = fileObj[id].character;

            // Se obtienen las opciones del archivo de textos traducidos
            let texts = this.translatorManager.translate(translationId, namespace, {
                name: this.playerName,
                context: this.context,
                returnObjects: getObjs
            });
            node.choices = texts;

            for (let i = 0; i < fileObj[id].choices.length; i++) {
                // Si hay un nodo despues de este, se crea de manera y se
                // guarda la id de dicho nodo en el array de nodos siguientes
                let nextNextNode = null;
                if (fileObj[id].choices[i].next) {
                    nextNextNode = this.readAllNodes(fileObj[id].choices[i].next, file, namespace, objectName, getObjs, nodesMap);
                }

                let choices = node.choices[i];
                if (!Array.isArray(choices)) {
                    choices = [choices]
                }

                for (let j = 0; j < choices.length; j++) {
                    const nextNode = this.createTextNode(node.character, choices[j], getObjs, nextNextNode);
                    nextNode.id = `${fileObj[id].choices[i].next}.${j}`;
                    nextNode.fullId = `${translationId}.${nextNode.id}`;

                    node.next.push(nextNode.fullId);

                    nodesMap.set(nextNode.fullId, nextNode);
                }
            }

            node.choices = texts.flat();

            if (fileObj[id].default.next) {
                let defaultNode = this.readAllNodes(fileObj[id].default.next, file, namespace, objectName, getObjs, nodesMap);
                node.next.push(defaultNode.fullId);
            }
        }
        // Si el nodo es de tipo evento
        else if (type === "event") {
            node = new EventNode();

            // Recorre todas las variables obtenidas
            for (let i = 0; i < fileObj[id].events.length; i++) {
                // Lee el nombre del evento
                let evtName = Object.keys(fileObj[id].events[i]);

                // Obtiene el objeto que guarda los parametros del evento
                let obj = fileObj[id].events[i][evtName];

                // Crea un objeto igual que obj, pero que tambien guarda su nombre
                let evt = { ...obj };
                evt.name = evtName[0];

                // Si se ha definido si la variable es global y si se ha definido que no lo
                // es, se guarda en las propiedades del evento la blackboard de esta escena
                if (obj.global !== undefined && obj.global === false) {
                    evt.blackboard = this.blackboard;
                }

                // Lo mete en las variables del nodo. Si es un evento de cambiar amistad, lo pone al principio de
                // los eventos (por si acaso se lanzan a la vez otros eventos que cambien la escena, ya que hacen
                // que los eventos de cambiar amistad no se lancen si van despues de un cambio de escena)
                if (evt.name === "changeFriendship") {
                    node.events.unshift(evt);
                }
                else {
                    node.events.push(evt);
                }
            }

            // Si hay un nodo despues de este, se crea de manera y se
            // guarda la id de dicho nodo en el array de nodos siguientes
            if (fileObj[id].next) {
                let nextNode = this.readAllNodes(fileObj[id].next, file, namespace, objectName, getObjs, nodesMap);
                node.next.push(nextNode.fullId);
            }
        }
        // Si el nodo es de tipo mensaje de texto
        else if (type === "chatMessage") {
            node = new ChatNode();

            // Obtiene el texto del archivo de textos traducidos y lo guarda
            let text = this.translatorManager.translate(translationId + ".text", namespace, {
                name: this.playerName,
                context: this.context,
                returnObjects: getObjs
            });

            node.text = text;

            // Obtiene el nombre del personaje del archivo de nombres localizados
            // En el caso de que se trate del jugador, obtiene su nombre
            let character = fileObj[id].character;

            let phone = fileObj[id].phone
            if (phone != null) {
                node.phone = phone
            }

            node.name = ""
            node.character = character;

            if (node.character != "") {
                if (node.phone) {
                    if (character === "player") {
                        node.name = this.gameManager.getUserInfo().name;
                    }
                    else {
                        node.name = this.translatorManager.translate(fileObj[id].character, "names");
                    }
                }
                else {
                    if (character === "player") {
                        node.name = this.computer.getUsername()
                    }
                    else {
                        node.name = this.translatorManager.translate(character, "computer\\usernames");
                    }
                }
            }

            node.chat = fileObj[id].chat
            // Guarda el chat en el que tiene que ir la respuesta y el retardo con el que se envia
            if (node.phone) {
                node.chat = this.translatorManager.translate("textMessages" + "." + fileObj[id].chat, "deviceInfo");
            }

            if (fileObj[id].replyDelay) {
                node.replyDelay = fileObj[id].replyDelay;
            }

            // Si hay un nodo despues de este, se crea de manera y se
            // guarda la id de dicho nodo en el array de nodos siguientes
            if (fileObj[id].next) {
                let nextNode = this.readAllNodes(fileObj[id].next, file, namespace, objectName, getObjs, nodesMap);
                node.next.push(nextNode.fullId);
            }
        }
        // Si el nodo es de tipo comentario de la red social
        else if (type === "commentary") {
            node = new CommentaryNode();

            let text = this.translatorManager.translate(translationId + ".text", namespace, {
                name: this.playerName,
                context: this.context,
                returnObjects: getObjs
            });

            node.text = text;

            node.character = fileObj[id].character;

            if (node.character == 'player') {
                node.name = this.computer.getUsername()
                node.pfp = 'unknownPfp'
            }
            else {
                node.name = this.translatorManager.translate(node.character, "computer\\usernames");

                let pfpsFile = this.cache.json.get('profilePictures');
                node.pfp = pfpsFile[node.character]
            }

            node.post = fileObj[id].post

            if (fileObj[id].replyDelay) {
                node.replyDelay = fileObj[id].replyDelay;
            }

            // Si hay un nodo despues de este, se crea de manera y se
            // guarda la id de dicho nodo en el array de nodos siguientes
            if (fileObj[id].next) {
                let nextNode = this.readAllNodes(fileObj[id].next, file, namespace, objectName, getObjs, nodesMap);
                node.next.push(nextNode.fullId);
            }
        }


        // Actualiza el nodo, ya que al momento de guardarse no estaba creado completamente
        nodesMap.set(translationId, node);
        node.id = nodeId;
        node.fullId = translationId;
        if (fileObj[id].nextDelay != null) {
            node.nextDelay = fileObj[id].nextDelay;
        }

        return node;
    }


    /**
     * Obtiene el objeto json a partir de su nombre
     * @param {Object} obj - objeto json en el que se busca el objeto
     * @param {String} prop - nombre de la propiedad (o del objeto) que se busca
     * @returns {Object} - objeto json con el nombre indicado
     */
    getObjFromName(obj, prop) {
        let nestedProperties = prop.split('.');
        let currObj = obj;

        for (let i = 0; i < nestedProperties.length; i++) {
            if (!currObj) {
                return null;
            }
            else {
                currObj = currObj[nestedProperties[i]];
            }
        }
        return currObj;
    }


    /**
    * Prepara los dialogos por si alguno es demasiado largo y se sale de la caja de texto
    * @param {Array} dialogs - array de dialogos a preparar
    * @returns {Array} - array con los dialogos ajustados
    */
    splitDialogs(dialogs, character, centered) {
        let newDialogs = [];        // Nuevo array de dialogos tras dividir los dialogos demasiado largos
        let i = 0;                  // Indice del dialogo en el array de dialogos
        let dialogCopy = "";        // Copia del dialogo con todos sus atributos
        let currText = "";          // Texto a dividir

        // Mientras no se haya llegado al final de los dialogos
        while (i < dialogs.length) {
            // Se establece si el texto esta centrado en la caja de texto para poder
            // hacer los saltos de liena con el ancho de linea correspondiente
            this.dialogManager.textbox.centerText(centered);

            // Cambia el texto a mostrar por el dialogo completo para obtener sus dimensiones
            // (se copia la informacion del dialogo actual, pero se cambia el texto a mostrar)
            currText = dialogs[i].text;
            dialogCopy = { ...dialogs[i] };
            dialogCopy.text = currText;
            this.dialogManager.setText(dialogCopy, false);

            // Si la altura del texto supera la de la caja de texto
            if (this.dialogManager.textTooBig()) {
                // Se separan todas las palabras del dialogo por espacios
                let words = currText.split(' ');
                let prevText = "";          // Texto antes de coger la siguiente palabra del dialogo
                let newText = "";           // Texto obtenido tras coger la siguiente palabra del dialogo
                let currWord = words[0];

                // Va recorriendo el array de palabras hasta que no quede ninguna
                while (words.length > 0) {
                    // Coge la primera palabra y actualiza tanto el
                    // texto anterior como el nuevo con dicha palabra
                    prevText = newText;
                    newText += " " + currWord;

                    // Cambia el texto por el nuevo para calcular sus dimensiones
                    dialogCopy = { ...dialogs[i] };
                    dialogCopy.text = newText;
                    this.dialogManager.setText(dialogCopy, false);

                    // Si no supera la altura de la caja de texto, saca la palabra del array
                    if (!this.dialogManager.textTooBig()) {
                        words.shift();
                        currWord = words[0];
                    }
                    // Si no, reinicia el texto y guarda el dialogo actual con el texto obtenido hasta el momento
                    else {
                        newText = "";
                        dialogCopy = { ...dialogs[i] };
                        dialogCopy.text = prevText;
                        newDialogs.push(dialogCopy);
                    }
                }
                // Una vez recorrido todo el dialogo, guarda el dialogo con el texto restante
                prevText = newText;
                newText += " " + currWord;
                dialogCopy = { ...dialogs[i] };
                dialogCopy.text = prevText;
                newDialogs.push(dialogCopy);

                i++;
            }
            // Si la altura no supera la de la caja de texto, se guarda
            // el dialogo actual y se pasa a mirar el siguiente
            else {
                dialogCopy = { ...dialogs[i] };
                dialogCopy.text = currText;
                newDialogs.push(dialogCopy);
                i++;
                if (dialogs[i]) currText = dialogs[i].text;
            }
        }

        let emptyDialog = {
            text: "",
            character: "",
            name: ""
        }

        this.dialogManager.setText(emptyDialog, false);
        return newDialogs;
    }


    /**
     * Crea el icono con el que interactuar con los elementos del escenario
     * @param {Number} x - posicion x del icono
     * @param {Number} y - posicion y del icono
     * @param {String} img - imagen que poner como icono
     * @param {Function} onClick - funcion a la que se llamara al hacer click sobre el icono
     * @param {Boolean} deactivateOnClick - true si la el icono desaparece al hacer click, false si se mantiene
     */
    createInteractiveElement(x, y, img, scale, onClick, deactivateOnClick, itemName, npc = false) {
        // Configuracion de las animaciones
        let animConfig = {
            fadeTime: 150,
            fadeEase: 'linear'
        }

        // Anade el icono del boton y lo hace interactivo
        let button = this.add.image(0, 0, img).setOrigin(1, 0).setScale(scale);
        button.setPosition(x, y);
        button.setInteractive({ useHandCursor: true });

        // Se reproduce la animacion de aparecer
        this.tweens.add({
            targets: button,
            alpha: { from: 0, to: 1 },
            ease: animConfig.fadeEase,
            duration: animConfig.fadeTime,
            repeat: 0,
        });

        // Al pulsar el icono
        button.on('pointerdown', () => {
            // Si hay que desactivar el boton al hacer click, deja de ser
            // interactivo y se reproduce la animacion de desaparecer
            if (deactivateOnClick) {
                button.disableInteractive();
                this.tweens.add({
                    targets: button,
                    alpha: { from: 1, to: 0 },
                    ease: animConfig.fadeEase,
                    duration: animConfig.fadeTime,
                    repeat: 0,
                });
            }
            // Si es valida, se ejecuta la funcion onClick
            if (onClick !== null && typeof onClick === 'function' && this.UIManager.lidAnim == null) {
                onClick();

                // TRACKER EVENT
                // console.log("Interactuando con", itemName);
                // this.gameManager.sendItemInteraction(itemName, npc);
                this.trackerManager.sendItemInteraction(itemName, npc);
            }

        });

        // Se reproduce la animacion de encogerse y agrandarse
        let originalScale = button.scale;
        this.tweens.add({
            targets: button,
            scale: originalScale * 0.9,
            duration: 1000,
            repeat: -1,
            yoyo: true
        });

        return button;
    }

}