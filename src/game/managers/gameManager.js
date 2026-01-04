import { Cameras } from "phaser";
const { FADE_OUT_COMPLETE } = Cameras.Scene2D.Events
import EventDispatcher from "../eventDispatcher";
import BaseScene from "../scenes/gameLoop/baseScene";
import { generateTrackerFromURL } from "../tracker/index";
import Tracker from "../tracker/tracker";
import LRS from "../tracker/lrs";
import { BasicAuthentication } from "../tracker/authentication";
import { AccountActor } from "../tracker/statement/actor";

// Variable de nivel de modulo
// - Se puede acceder desde cualquier parte del modulo, pero no es visible
// al no pertenecer a la clase y no ser exportada
// - No cambia con las instancia puesto que no pertenece a la clase, sino
// al modulo y solo existe un modulo

let instance = null;

export default class GameManager {
    /**
    * Maneja el flujo de juego y variables de uso comun
    * @param {Scene} - se necesita una escena para poder acceder al ScenePlugin y cambiar de escena
    */
    constructor(scene) {
        // no deberia suceder, pero por si acaso se hace el new de la clase desde fuera
        if (instance === null) {
            instance = this;
        }
        else {
            throw new Error('GameManager is a Singleton class!');
        }

        // this.initializeTracker();

        // Se necesita una escena para poder acceder al ScenePlugin y cambiar de escena
        // Por lo tanto, se aprovecha para mantener la escena actual
        // El SceneManager tb incluye el cambio de escena, pero no es recomendable segun
        // la docu manejarlo a traves de el
        this.currentScene = scene;
        this.runningScenes = new Set();
        this.fading = false;

        this.i18next = this.currentScene.plugins.get('rextexttranslationplugin');
        this.dispatcher = EventDispatcher.getInstance();

        // Blackboard de variables de todo el juego
        this.blackboard = new Map();

        // Escena de la UI
        this.UIManager = null;

        // Ordenador
        this.computer = null;

        // Informacion del usuario
        this.userInfo = {
            name: null,
            gender: null,
            harasser: null
        };

        // Configuracion de texto por defecto
        this.textConfig = {
            fontFamily: 'Arial',        // Fuente (tiene que estar precargada en el html o el css)
            fontSize: '25px',        // Tamano de la fuente del dialogo
            fontStyle: 'normal',        // Estilo de la fuente
            backgroundColor: null,      // Color del fondo del texto
            color: '#ffffff',           // Color del texto
            stroke: '#000000',          // Color del borde del texto
            strokeThickness: 0,         // Grosor del borde del texto 
            align: 'left',              // Alineacion del texto ('left', 'center', 'right', 'justify')
            wordWrap: null,
            padding: null               // Separacion con el fondo (en el caso de que haya fondo)
        }

        this.generateTextures();
    }

    // metodo para generar y coger la instancia
    static create(scene) {
        if (instance === null) {
            instance = new GameManager(scene);
        }
        return instance;
    }

    // metodo para generar y coger la instancia
    static getInstance() {
        return this.create();
    }



    ///////////////////////////////////////
    /// Metodos para cambiar de escena ///
    //////////////////////////////////////

    startTestScene() {
        this.blackboard.clear();
        this.userInfo = {
            name: "Paco",
            gender: "female",
            harasser: "female"
        }


        let UIsceneName = 'UIManager';
        this.currentScene.scene.stop(UIsceneName);
        this.currentScene.scene.launch(UIsceneName);
        this.UIManager = this.currentScene.scene.get(UIsceneName);

        let computerSceneName = 'Computer';
        this.currentScene.scene.stop(computerSceneName);
        this.currentScene.scene.run(computerSceneName);
        this.computer = this.currentScene.scene.get(computerSceneName);
        this.computer.scene.sleep();

        // this.startGame(this.userInfo)
        // this.changeScene("Scene1Lunch1", {});
        // this.changeScene("Scene1Bedroom1", {});
        // this.changeScene("Scene2Bedroom", {});
        // this.changeScene("Scene3Bedroom", {});
        // this.changeScene("Scene4Garage", {});
        // this.changeScene("Scene6Livingroom", {});
        this.changeScene("Scene6EndingRouteA", {});
        // this.changeScene("Scene7Bedroom", {});

    }

    startTitleScene() {
        // IMPORTANTE: Hay que lanzar primero el UIManager para que se inicialice
        // el DialogManager y las escenas puedan crear los dialogos correctamente
        let UIsceneName = 'UIManager';
        this.currentScene.scene.stop(UIsceneName);
        this.currentScene.scene.launch(UIsceneName);
        this.UIManager = this.currentScene.scene.get(UIsceneName);

        this.changeScene("TitleScene", {});
    }

    startGame(userInfo) {
        this.blackboard.clear();
        this.userInfo = userInfo;

        let computerSceneName = 'Computer';
        this.currentScene.scene.stop(computerSceneName);
        this.currentScene.scene.run(computerSceneName);
        this.computer = this.currentScene.scene.get(computerSceneName);
        this.computer.scene.sleep();

        // Pasa a la escena inicial con los parametros text, onComplete y onCompleteDelay
        let params = {
            text: this.translate("scene1.classroom", { ns: "transitions", returnObjects: true }),
            onComplete: () => {
                this.UIManager.phoneManager.activatePhoneIcon(false);
                this.changeScene("Scene1Classroom", null);
            },
        };
        this.changeScene("TextOnlyScene", params);

        // TRACKER EVENT
        // console.log("Inicio del dia 1");
        this.sendStartGame();
    }

    /**
     * Metodo para borrar y cerrar todas las escenas activas
     */
    clearRunningScenes() {
        this.runningScenes.forEach(sc => {
            // Si la escena es hija de BaseScene, se tiene que llamar a su shutdown 
            // antes de detener la escena para evitar problemas al borrar los retratos
            if (sc instanceof BaseScene) {
                if (typeof sc.shutdown === 'function') {
                    sc.shutdown();
                }
            }
            sc.scene.stop(sc);
        });
        this.runningScenes.clear();
    }

    /**
    * Metodo para cambiar de escena
    * @param {String} scene - key de la escena a la que se va a pasar
    * @param {Object} params - informacion que pasar a la escena (opcional)
    * @param {Boolean} cantReturn - true si se puede regresar a la escena anterior, false en caso contrario
    */
    changeScene(scene, params, canReturn = false) {
        // Reproduce un fade out al cambiar de escena
        this.FADE_OUT_TIME = 200;
        this.FADE_IN_TIME = 200;

        if (params != null) {
            if (params.fadeOutTime != null) {
                this.FADE_OUT_TIME = params.fadeOutTime;
            }
            if (params.fadeInTime != null) {
                this.FADE_IN_TIME = params.fadeInTime;
            }
        }

        this.currentScene.cameras.main.fadeOut(this.FADE_OUT_TIME, 0, 0, 0);
        this.fading = true;

        // TODO: DISCARDED TRACKER EVENT
        // console.log("Saliendo de", this.currentScene.scene.key);

        // Cuando acaba el fade out de la escena actual se cambia a la siguiente
        this.currentScene.cameras.main.once(FADE_OUT_COMPLETE, (cam, effect) => {
            // Si no se puede volver a la escena anterior, se detienen todas las
            // escenas que ya estaban creadas porque ya no van a hacer falta 
            if (!canReturn) {
                this.clearRunningScenes();
            }
            // Si no, se se duerme la escena actual en vez de destruirla ya que
            // habria que mantener su estado por si se quiere volver a ella
            else {
                this.currentScene.scene.sleep();
            }

            // Se inicia y actualiza la escena actual
            this.currentScene.scene.run(scene, params);

            this.currentScene = this.currentScene.scene.get(scene);

            // Se anade la escena a las escenas que estan ejecutandose
            this.runningScenes.add(this.currentScene);

            // Cuando se termina de crear la escena, se reproduce el fade in
            this.currentScene.events.on('create', () => {
                this.currentScene.cameras.main.fadeIn(this.FADE_IN_TIME, 0, 0, 0);
                this.fading = false;
            });
            this.currentScene.events.on('wake', () => {
                this.currentScene.cameras.main.fadeIn(this.FADE_IN_TIME, 0, 0, 0);
                this.fading = false;
            });

            // TRACKER EVENT
            // console.log("Entrando en", scene);
            this.sendEnterScene(scene, params);
        });
    }


    switchToComputer(onWake) {
        // Reproduce un fade out al cambiar de escena
        let FADE_OUT_TIME = 200;
        let FADE_IN_TIME = 200;

        this.currentScene.cameras.main.fadeOut(FADE_OUT_TIME, 0, 0, 0);
        this.fading = true;

        // Cuando acaba el fade out de la escena actual se cambia a la siguiente
        this.currentScene.cameras.main.once(FADE_OUT_COMPLETE, (cam, effect) => {

            this.UIManager.phoneManager.activatePhoneIcon(false);
            this.currentScene.scene.sleep()

            this.computer.scene.wake()

            // Cuando se termina de crear la escena, se reproduce el fade in
            this.computer.events.once('wake', () => {
                this.computer.cameras.main.fadeIn(FADE_IN_TIME, 0, 0, 0);
                this.fading = false;

                if (onWake) {
                    onWake()
                }
            });
        })
    }

    leaveComputer(onWake) {
        // Reproduce un fade out al cambiar de escena
        let FADE_OUT_TIME = 200;
        let FADE_IN_TIME = 200;

        this.computer.cameras.main.fadeOut(FADE_OUT_TIME, 0, 0, 0);
        this.fading = true;

        // Cuando acaba el fade out de la escena actual se cambia a la siguiente
        this.computer.cameras.main.once(FADE_OUT_COMPLETE, (cam, effect) => {

            this.computer.scene.sleep()
            this.currentScene.scene.wake(this.currentScene.scene.key)

            // Cuando se termina de crear la escena, se reproduce el fade in
            this.currentScene.events.once('wake', () => {
                this.UIManager.phoneManager.activatePhoneIcon(true);
                this.currentScene.cameras.main.fadeIn(FADE_IN_TIME, 0, 0, 0);
                this.fading = false;

                if (onWake) {
                    onWake()
                }
            });
        })
    }

    // Tiene los campos: name, username, password, gender
    setUserInfo(userInfo) {
        this.userInfo = userInfo;
        this.blackboard.set("gender", userInfo.gender);
    }
    getUserInfo() {
        return this.userInfo;
    }

    isInFadeAnimation() {
        return this.fading;
    }



    ///////////////////////////////////////
    ///// Metodos para la blackboard /////
    //////////////////////////////////////

    /**
    * Devuelve el valor buscado en la blackboard
    * @param {String} key - valor buscado
    * @param {Map} blackboard - blackboard en la que se busca el valor. Por defecto es la del gameManager 
    * @returns {object} - el objeto buscado en caso de que exista. null en caso contrario
    */
    getValue(key, blackboard = this.blackboard) {
        if (blackboard.has(key)) {
            return blackboard.get(key);
        }
        return null;
    }

    /**
    * Metodo que setea un valor en la blackboard
    * @param {String} key - valor que se va a cambiar
    * @param {Object} value - valor que se le va a poner al valor a cambiar
    * @param {Map} blackboard - blackboard en la que se cambia el valor. Por defecto es la del gameManager 
    * @returns {boolean} - true si se ha sobrescrito un valor. false en caso contrario
    */
    setValue(key, value, blackboard = this.blackboard) {
        let exists = false;
        if (blackboard.has(key)) {
            exists = true;
        }
        blackboard.set(key, value);
        return exists;
    }

    /**
    * Indica si un valor existe o no en la blackboard
    * @param {String} key - valor buscado
    * @param {Map} blackboard - blackboard en la que se busca el valor. Por defecto es la del gameManager
    * @returns {boolean} - true si existe el valor. false en caso contrario
    */
    hasValue(key, blackboard = this.blackboard) {
        return blackboard.has(key);
    }



    ///////////////////////////////////////
    /// Metodos para generar texturas ////
    //////////////////////////////////////

    /**
     * Se utiliza para generar las diferentes texturas que se van a usar en los menus y poder
     * tener un sencillo acceso a los diferentes parametros de cada una (nombre, tam...)
     */
    generateTextures() {
        const OFFSET = 10

        // Se crea un objeto grafico, que sirve para formas primitivas (resulta muy util para dibujar elementos con bordes redondeados)
        // Ademas, si el objeto grafico no va a modificar durante el tiempo es recomendable convertirlo en una textura y usarla
        // para mejorar el rendimiento
        this.graphics = this.currentScene.add.graphics();

        // Se crea un rectangulo con bordes redondeados que sirve para una caja de texto
        this.textBox = {
            fill: {
                name: "fillTextBox",
                color: 0xffffff
            },
            edge: {
                name: "edgeTextBox",
                color: 0x000000,
                width: 2.5
            },
            width: 345,
            height: 105,
            arc: 15,
            offset: OFFSET
        }
        this.generateBox(this.textBox);

        // Se crea un rectangulo alargado con bordes redondeados que sirve para una caja donde introducir input
        this.inputBox = {
            fill: {
                name: "fillInputBox",
                color: 0xffffff
            },
            edge: {
                name: "edgeInputBox",
                color: 0x000000,
                width: 2.5
            },
            width: 335,
            height: 90,
            arc: 15,
            offset: OFFSET
        }
        this.generateBox(this.inputBox);

        // Se crea un cuadrado con bordes redondeados
        this.roundedSquare = {
            fill: {
                name: 'fillSquare',
                color: 0xffffff
            },
            edge: {
                name: "edgeSquare",
                color: 0x000000,
                width: 2.5
            },
            width: 100,
            height: 100,
            arc: 10,
            offset: OFFSET
        }
        this.generateBox(this.roundedSquare);

        // Se crea un cuadrado con bordes redondeados
        this.widerRoundedSquare = JSON.parse(JSON.stringify(this.roundedSquare));
        this.widerRoundedSquare.fill.name = "fillWiderSquare"
        this.widerRoundedSquare.edge.name = "edgeWiderSqaure"
        this.widerRoundedSquare.edge.width = 5
        this.generateBox(this.widerRoundedSquare);

        this.graphics.destroy();
    }

    /**
     * Sirve para crear una forma primitva usando el objeto grafico creado anteriormente
     * Se van a crear tanto la parte interior como el borde de la forma
     * IMPORTANTE:
     * - La forma primitva no se puede crear pegada a uno de los bordes de la pantalla porque sino hay ciertos detalles que se pierden
     * - La textura generada a partir de la forma primitiva no puede ser exactamente del mismo detalle que la forma porque sino hay
     *      ciertos detalles que se pierden.
     * Por los motivos nombrados arriba se utiliza un pequeño offset. Sin embargo, esto va a provocar que la caja de colision
     * textura sea un poquito mas grande que la textura en si
     * Nota: a la hora de crear una forma primitiva con un objeto grafico, el (0, 0) esta arriba a la izquierda
     */
    generateBox(params) {
        // Parte interior
        this.graphics.fillStyle(params.fill.color, 1);
        this.graphics.fillRoundedRect(params.offset, params.offset, params.width, params.height, params.arc);
        this.graphics.generateTexture(params.fill.name, params.width + params.offset * 2, params.height + params.offset * 2);
        this.graphics.clear();

        // Borde
        this.graphics.lineStyle(params.edge.width, params.edge.color, 1);
        this.graphics.strokeRoundedRect(params.offset, params.offset, params.width, params.height, params.arc);
        this.graphics.generateTexture(params.edge.name, params.width + params.offset * 2, params.height + params.offset * 2);
        this.graphics.clear();
    }

    componentToHex(component) {
        // Se convierte en un numero de base 16, en string
        let hex = component.toString(16);
        // Si el numero es menor que 16, solo tiene un digito, por lo que hay que anadir un 0 delante
        return hex.length == 1 ? "0" + hex : hex;
    }

    rgbToHex(R, G, B) {
        return "#" + componentToHex(R) + componentToHex(G) + componentToHex(B);
    }

    hexToRgb(hex) {
        // ^ ---> tiene que comenzar por #
        // a-f\d --> caracteres entre a-f y entre 0-9 (\d)
        // {2} --> grupo de dos caracteres que cumplan la condicion de arriba
        // $ --> final de la cadena. De modo que por ejemplo, "Some text #ffffff some more" no valdria
        // i --> se permiten letras en minuscula y en mayuscula
        let regex = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i
        let result = regex.exec(hex);

        if (result) {
            return {
                R: parseInt(result[1], 16),
                G: parseInt(result[2], 16),
                B: parseInt(result[3], 16)
            }
        }
        return null;
    }



    //////////////////////////////////////////
    /// Metodos para obtener traducciones ////
    /////////////////////////////////////////

    /**
     * Obtiene el texto traducido
     * @param {String} translationId - id completa del nodo en el que mirar
     * @param {Object} options - parametros que pasarle a i18n
     * @returns 
     */
    translate(translationId, options) {
        let str = this.i18next.t(translationId, options);

        // Si se ha obtenido algo
        if (str != null) {
            // Si el objeto obtenido no es un array, devuelve el texto con las expresiones <> reemplazadas
            if (!Array.isArray(str)) {
                if (str.text != null) {
                    return this.replaceGender(str.text);
                }
                else {
                    return this.replaceGender(str)
                }
            }
            // Si es un array
            else {
                // Recorre todos los elementos
                for (let i = 0; i < str.length; i++) {
                    // Si el elemento tiene la propiedad text, modifica el
                    // objeto original para reemplazar su contenido por el
                    // texto con las expresiones <> reemplazadas
                    if (str[i].text != null) {
                        str[i] = this.replaceGender(str[i].text);
                    }
                }
            }
        }
        return str;
    }

    /**
     * Reemplaza en el string indicado todos los contenidos que haya entre <>
     * con el formato: <player, male expression, female expression >, en el que 
     * la primera variable es el contexto a comprobar y las otras dos expresiones
     * son el texto por el que sustituir todo lo que hay entre <>
     * @param {String} input - texto en el que reemplazar las expresiones <>
     * @returns {String} - texto con las expresiones <> reemplazadas
     */
    replaceGender(input) {
        // Expresion a sustituir (todo lo que haya entre <>)
        let regex = /<([^>]+)>/g;

        // Encuentra todos los elementos entre <>
        let matches = [...input.matchAll(regex)];

        let result = '';
        let lastEndIndex = 0;
        // Por cada <>
        matches.forEach((match, index) => {
            // Obtiene todo el contenido entre <> y lo separa en un array
            let [fullMatch, content] = match;
            let variable = content.split(", ");

            // Elige que variable se usara para comprobar el contexto
            let useContext = null;
            if (variable[0] === "player") {
                useContext = this.userInfo.gender;
            }
            else if (variable[0] === "harasser") {
                useContext = this.userInfo.harasser;
            }

            // Elige el texto por el que reemplazar la expresion dependiendo del contexto
            let replacement = "";
            if (useContext != null) {
                if (useContext === "male") {
                    replacement = variable[1];
                }
                else if (useContext === "female") {
                    replacement = variable[2];
                }
            }

            // Anade el texto reemplazado al texto completo
            result += input.slice(lastEndIndex, match.index) + replacement;

            // Actualiza el indice del ultimo <> para el siguiente <>
            lastEndIndex = match.index + fullMatch.length;
        });

        // Anade el resto del texto al texto completo
        result += input.slice(lastEndIndex);
        return result;
    }



    ////////////////////////////
    /// Metodos del tracker ////
    ////////////////////////////

    initializeTracker() {
        this.trackerInitialized = false;
        this.gameCompleted = false;

        try {
            this.tracker = generateTrackerFromURL();
        }
        catch {
            this.tracker = new Tracker(
                new LRS({
                    baseUrl: "https://cloud.scorm.com/lrs/YQFKDDG1H6/sandbox/",
                    authScheme: new BasicAuthentication("oMsoz51hM_OQbNNR3Nk", "LfWapsOhe1V-ryV2C6o"),
                    serializer: (statement, version) => statement.serializeToXApi(version)
                }),
                new AccountActor("http://example.com", "TestActor")
            );
        }

        this.accesible = this.tracker.accesible;
        this.alternative = this.tracker.alternative;
        this.completable = this.tracker.completable;
        this.gameObject = this.tracker.gameObject;

        this.trackerInitialized = this.tracker !== null && this.accesible !== null && this.alternative !== null && this.completable !== null && this.gameObject !== null;
    }

    sendEnterScene(scene, params) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let type = this.accesible.types.area;

            if (scene == "TextOnlyScene") {
                type = this.accesible.types.cutscene;
            }
            let evt = this.accesible.accessed(type, "EnterScene");

            evt.result.setExtension("Scene", scene);
            if (scene == "TextOnlyScene") {
                evt.result.setExtension("Text", params.text);
            }

            this.tracker.addEvent(evt);
        }
    }
    sendEnterChat(chatName) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.accesible.accessed(this.accesible.types.screen, "EnterChat");
            evt.result.setExtension("Chat", chatName);
            this.tracker.addEvent(evt);
        }
    }
    sendExitChat(fromChatButton = true) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let method = "ChatReturnButton";
            if (!fromChatButton) {
                method = "PhoneReturnButton";
            }
            let evt = this.accesible.accessed(this.accesible.types.screen, "ExitChat");
            evt.result.setExtension("Chat", "PhoneChatList");
            evt.result.setExtension("Method", method);

            this.tracker.addEvent(evt);
        }
    }


    sendStartGame() {
        this.day = 1;
        this.TOTAL_DAYS = 7.0;

        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.seriousGame, "GameStart");
            evt.result.setExtension("Gender", this.userInfo.gender);
            evt.result.setExtension("Sexuality", this.userInfo.sexuality);

            this.tracker.addEvent(evt);

            // this.sendGameProgress();
        }
    }
    sendGameProgress() {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.progressed(this.completable.types.seriousGame, "GameProgress", this.day / this.TOTAL_DAYS);
            evt.result.setExtension(evt.result.types.progress, this.day / this.TOTAL_DAYS);
            evt.result.setExtension("EndingDay", this.day);
            this.day++;

            this.tracker.addEvent(evt);
            this.tracker.sendEvents();
        }
    }
    sendEndGame() {
        if (this.trackerInitialized && !this.gameCompleted) {
            this.sendGameProgress();

            this.gameCompleted = true;

            let ending = this.getValue("routeA") ? "routeA" : "routeB";
            let explained = this.getValue("explained")

            let evt = this.completable.completed(this.completable.types.seriousGame, "GameEnd", 1, true, true);
            evt.result.setExtension("Ending", ending);
            evt.result.setExtension("Explained", explained);
            this.tracker.addEvent(evt);

            this.tracker.close();
        }
    }


    sendItemInteraction(objectName, extensions = null, npc = false) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let type = this.gameObject.types.gameObject;
            if (npc) {
                type = this.gameObject.types.npc;
            }

            let evt = this.gameObject.interacted(type, "ObjectInteraction");

            if (extensions !== null) {
                for (const [key, value] of Object.entries(extensions)) {
                    evt.result.setExtension(key, value);
                }
            }
            evt.result.setExtension("Object", objectName);

            this.tracker.addEvent(evt);
        }
    }
    sendComputerScreenClick(x, y) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.gameObject.interacted(this.gameObject.types.item, "ComputerScreenClick");
            evt.result.setExtension("PointerX", x);
            evt.result.setExtension("PointerY", y);
            this.tracker.addEvent(evt);
        }
    }


    sendDialogStarted(nodeId, dialogText) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.storyNode, "DialogStart");
            evt.result.setExtension("Node", this.currentScene.scene.key + "." + nodeId);
            evt.result.setExtension("Dialog", dialogText);
            this.tracker.addEvent(evt);
        }
    }
    sendDialogEnded(nodeId, dialogText) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.completed(this.completable.types.storyNode, "DialogEnd", 1, true, true);
            evt.result.setExtension("Node", this.currentScene.scene.key + "." + nodeId);
            evt.result.setExtension("Dialog", dialogText);
            this.tracker.addEvent(evt);
        }
    }
    sendChoiceSelected(nodeId, choiceText) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.alternative.selected(this.alternative.types.dialogTree, "OptionSelect", " ");
            evt.result.setExtension("Node", this.currentScene.scene.key + "." + nodeId);
            evt.result.setExtension("Response", choiceText);

            this.tracker.addEvent(evt);
        }
    }
    sendAnswerFriend(timesListened) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.alternative.selected(this.alternative.types.dialogTree, "Day3BreakConversation", " ");
            evt.result.setExtension("TimesListened", timesListened);

            this.tracker.addEvent(evt);
        }
    }

    sendNotificationReceived(chat) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.quest, "NotificationReceived");
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }
    sendNotificationsCleared(chat) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.completed(this.completable.types.quest, "NotificationSeen", 1, true, true);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }

    sendCanAnswerChat(nodeId, chat) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.quest, "CanAnswerChat");
            evt.result.setExtension("Node", this.currentScene.scene.key + "." + nodeId);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }
    sendAnsweredChat(nodeId, chat) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.completed(this.completable.types.quest, "AnswerChat", 1, true, true);
            evt.result.setExtension("Node", this.currentScene.scene.key + "." + nodeId);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }


}