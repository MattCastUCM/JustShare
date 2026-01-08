import { Scene, Cameras } from "phaser"
const { FADE_OUT_COMPLETE } = Cameras.Scene2D.Events
import BaseScene from "../scenes/gameLoop/baseScene"
import TrackerManager from "./trackerManager";

export default class SceneManager {
    private static instance: SceneManager

    private static readonly FADE_OUT_TIME: number = 200;
    private static readonly FADE_IN_TIME: number = 200

    private currentScene: Scene

    private runningScenes: Set<Scene>
    private parallelScenes: Set<Scene>
    private persistentScenes: Set<Scene>

    private fading: boolean

    private trackerManager: TrackerManager

    private constructor() {
        this.runningScenes = new Set<Scene>();
        this.parallelScenes = new Set<Scene>();
        this.persistentScenes = new Set<Scene>();
        
        this.fading = false;
    }

    public init(scene: Scene) {
        this.currentScene = scene
        this.trackerManager = TrackerManager.getInstance();
    }

    public static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }

        return SceneManager.instance;
    }

    private clearScenes(scenes: Set<Scene>) {
        scenes.forEach(scene => {
            // Si la escena es hija de BaseScene, se tiene que llamar a su shutdown 
            // antes de detener la escena para evitar problemas al borrar los retratos
            if (scene instanceof BaseScene) {
                scene.shutdown();
            }
            scene.scene.stop(scene);
        });
        scenes.clear();
    }

    public runInParallel(sceneKey: string) {
        this.currentScene.scene.launch(sceneKey);
        const scene = this.currentScene.scene.get(sceneKey);
        this.parallelScenes.add(scene);
    }

    public clearParallelScenes() {
        this.clearScenes(this.parallelScenes);
    }

    public addPersistentScene(sceneKey: string) {
        this.currentScene.scene.launch(sceneKey);
        const scene = this.currentScene.scene.get(sceneKey);
        scene.scene.sleep();
        this.persistentScenes.add(scene);
    }

    public clearPersistentScenes() {
        this.clearScenes(this.persistentScenes);
    }

    public stopScene(sceneKey: string) {
        this.currentScene.scene.stop(sceneKey)
    }

    public getScene(sceneKey: string) {
        const scene = this.currentScene.scene.get(sceneKey);
        return scene;
    }

    public getCurrentScene() {
        return this.currentScene
    }

    /**
     * Método para borar y cerrar todas las escenas activas
     */
    public clearRunningScenes() {
        this.clearScenes(this.runningScenes);
    }

    /**
     * Metodo para cambiar de escena
     * @param {string} sceneKey - key de la escena a la que se va a pasar
     * @param {Object} params - informacion que pasar a la escena (opcional)
     * @param {boolean} canReturn - true si se puede regresar a la escena anterior, false en caso contrario
     */
    public changeScene(sceneKey: string, params: Record<string, any> = {}, canReturn: boolean = false) {
        // Reproduce un fade out al cambiar de escena
        let fadeOutTime = SceneManager.FADE_OUT_TIME;
        let fadeIntime = SceneManager.FADE_IN_TIME;

        if (params.fadeOutTime != null) {
            fadeOutTime = params.fadeOutTime;
        }
        if (params.fadeInTime != null) {
            fadeIntime = params.fadeInTime;
        }

        this.currentScene.cameras.main.fadeOut(fadeOutTime, 0, 0, 0);
        this.fading = true;

        // TODO: DISCARDED TRACKER EVENT
        // console.log("Saliendo de", this.currentScene.scene.key);

        // Cuando acaba el fade out de la escena actual se cambia a la siguiente
        this.currentScene.cameras.main.once(FADE_OUT_COMPLETE, (_cam: Cameras.Scene2D.Camera, _effect: Cameras.Scene2D.Effects.Fade) => {
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
            const targetScene = this.currentScene.scene.get(sceneKey);
            if (targetScene && this.persistentScenes.has(targetScene)) {
                this.currentScene.scene.run(sceneKey, params);
                this.currentScene = targetScene;
            }
            else {
                this.currentScene.scene.run(sceneKey, params);
                this.currentScene = this.currentScene.scene.get(sceneKey);

                // Se anade la escena a las escenas que estan ejecutandose
                this.runningScenes.add(this.currentScene);
            }

            // Cuando se termina de crear la escena, se reproduce el fade in
            this.currentScene.events.on('create', () => {
                this.currentScene.cameras.main.fadeIn(fadeIntime, 0, 0, 0);
                this.fading = false;
            });
            this.currentScene.events.on('wake', () => {
                this.currentScene.cameras.main.fadeIn(fadeIntime, 0, 0, 0);
                this.fading = false;
            });

            // TRACKER EVENT
            // console.log("Entrando en", sceneKey);
            this.trackerManager.sendEnterScene(sceneKey, params);
        });
    }

    isInFadeAnimation() {
        return this.fading;
    }
}