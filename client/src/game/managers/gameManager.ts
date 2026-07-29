import SceneManager from "./sceneManager";
import TrackerManager from "./trackerManager";
import TranslatorManager from "./translatorManager";
import Computer from "../computer/computer";
import UIManager from "./UIManager";
import { UserInfo } from "../../types/user";

export default class GameManager {
    private sceneManager: SceneManager;
    private trackerManager: TrackerManager;
    private translatorManager: TranslatorManager;

    private static instance: GameManager;

    // Blackboard de variables de todo el juego
    public blackboard: Map<string, any>;

    // Escena de la UI
    public UIManager: UIManager

    // Escena del ordenador
    private computer: Computer;
    private sceneBeforeComputer: string;

    // Informacion del usuario
    private userInfo: UserInfo;

    protected constructor() {
        // Blackboard de variables de todo el juego
        this.blackboard = new Map();
        this.userInfo = {
            name: "",
            player: "male",
            sexuality: "heterosexual",
            harasser: "male"
        }
    }

    public init() {
        this.sceneManager = SceneManager.getInstance();
        this.trackerManager = TrackerManager.getInstance();
        this.translatorManager = TranslatorManager.getInstance();
    }

    public static getInstance() {
        GameManager.instance = GameManager.instance ?? new GameManager();
        return GameManager.instance;
    }

    private resetGame() {
        this.blackboard.clear();

        this.sceneManager.clearParallelScenes();
        this.sceneManager.clearPersistentScenes();

        let UIsceneName = 'UIManager';
        this.sceneManager.runInParallel(UIsceneName);
        this.UIManager = this.sceneManager.getScene(UIsceneName) as UIManager;
    }

    public startTitleScene() {
        this.resetGame()

        this.sceneManager.changeScene("TitleScene");
        // this.startGame({
        //     name: "memo",
        //     player: "male",
        //     sexuality: "homosexual",
        //     harasser: "male"
        // })
    }

    public startGame(userInfo: UserInfo) {
        this.userInfo = userInfo;

        this.translatorManager.setGenderContext("player", userInfo.player);
        this.translatorManager.setGenderContext("harasser", userInfo.harasser)

        let computerSceneName = 'Computer';
        this.sceneManager.addPersistentScene(computerSceneName);
        this.computer = this.sceneManager.getScene(computerSceneName) as Computer;

        // Pasa a la escena inicial con los parametros text y onComplete
        let params: Record<string, any> = {
            text: this.translatorManager.translate("scene1.classroom", "transitions"),
            onComplete: () => {
                this.UIManager.phoneManager?.activatePhoneIcon(false);
                this.sceneManager.changeScene("Scene1Classroom");
            },
        };
        this.sceneManager.changeScene("TextOnlyScene", params)

        // this.sceneManager.changeScene("Scene1Classroom");

        // TRACKER EVENT
        // console.log("Inicio del dia 1");
        // this.sendStartGame();
        this.trackerManager.sendStartGame(userInfo);
    }

    public switchToComputer(onComplete?: () => void) {
        this.sceneBeforeComputer = this.sceneManager.getCurrentScene().scene.key;
        let params = {
            onWake: () => {
                this.UIManager.phoneManager?.activatePhoneIcon(false);
                onComplete?.();
            }
        };
        this.sceneManager.changeScene("Computer", params, true)
    }

    public leaveComputer(onComplete?: () => void) {
        let params = {
            onWake: () => {
                this.UIManager.phoneManager?.activatePhoneIcon(true);
                onComplete?.();
            }
        };
        this.sceneManager.changeScene(this.sceneBeforeComputer, params, true);

    }

    public getUserInfo() {
        return this.userInfo;
    }

    public getComputer() {
        return this.computer;
    }
}