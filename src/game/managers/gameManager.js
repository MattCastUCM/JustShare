import { Cameras } from "phaser";
const { FADE_OUT_COMPLETE } = Cameras.Scene2D.Events

import EventDispatcher from "../eventDispatcher";

import BaseScene from "../scenes/gameLoop/baseScene";
import SceneManager from "./sceneManager";
import { generateTextures } from "../utils/graphics";
import TrackerManager from "./trackerManager";

export default class GameManager {
    constructor() {
        if (GameManager.instance) {
            throw new Error("GameManager is a singleton. Use GameManager.getInstance() instead.")
        }

        this.sceneManager = null;
        this.trackerManager = null;

        // Blackboard de variables de todo el juego
        this.blackboard = new Map();

        // Escena de la UI
        this.UIManager = null;

        // Escena del ordenador
        this.computer = null;
        this.sceneBeforeComputer = null;

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
    }

    init(scene) {
        this.i18next = scene.plugins.get('rextexttranslationplugin');
        generateTextures(scene);

        this.sceneManager = SceneManager.getInstance();
        this.trackerManager = TrackerManager.getInstance();
    }

    static getInstance() {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    resetGame() {
        this.blackboard.clear();

        this.sceneManager.clearParallelScenes();
        this.sceneManager.clearPersistentScenes();

        let UIsceneName = 'UIManager';
        this.sceneManager.runInParallel(UIsceneName);
        this.UIManager = this.sceneManager.getScene(UIsceneName);
    }

    startTitleScene() {
        this.resetGame()

        this.sceneManager.changeScene("TitleScene");
    }

    startGame(userInfo) {
        this.userInfo = userInfo;

        let computerSceneName = 'Computer';
        this.sceneManager.addPersistentScene(computerSceneName);
        this.computer = this.sceneManager.getScene(computerSceneName);

        // Pasa a la escena inicial con los parametros text y onComplete
        let params = {
            text: this.translate("scene1.classroom", { ns: "transitions", returnObjects: true }),
            onComplete: () => {
                // this.UIManager.phoneManager.activatePhoneIcon(false);
                // this.changeScene("Scene1Classroom", null);
                this.UIManager.phoneManager.activatePhoneIcon(true);
                this.sceneManager.changeScene("Scene1Bedroom1")
            },
        };
        this.sceneManager.changeScene("TextOnlyScene", params)

        // TRACKER EVENT
        // console.log("Inicio del dia 1");
        // this.sendStartGame();
        this.trackerManager.sendStartGame(userInfo);
    }

    switchToComputer() {
        this.sceneBeforeComputer = this.sceneManager.getCurrentScene();
        let params = {
            onWake: () => {
                this.UIManager.phoneManager.activatePhoneIcon(false);
            }
        };
        this.sceneManager.changeScene("Computer", params, true)
    }

    leaveComputer(onWake) {
        if (this.sceneBeforeComputer != null) {
            let params = {
                onWake: () => {
                    this.UIManager.phoneManager.activatePhoneIcon(true);
                }
            };
            this.sceneManager.changeScene(this.sceneBeforeComputer, params, true);
            this.sceneBeforeComputer = null;
        }
    }

    setUserInfo(userInfo) {
        // Tiene los campos: name, username, password, gender
        this.userInfo = userInfo;
        this.blackboard.set("gender", userInfo.gender);
    }

    getUserInfo() {
        return this.userInfo;
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
}