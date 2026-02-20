import { generateTrackerFromURL } from "../../tracker/index";
import Tracker from "../../tracker/tracker";
import LRS from "../../tracker/lrs";
import { BasicAuthentication } from "../../tracker/authentication";
import { AccountActor } from "../../tracker/statement/actor";
import GameManager from "./gameManager";
import SceneManager from "./sceneManager";
import TrackerEvent from "../../tracker/statement/trackerEvent";
import { UserInfo } from "../../types/user";
import Alternative from "../../tracker/interfaces/alternative";
import Accessible from "../../tracker/interfaces/accessible";
import Completable from "../../tracker/interfaces/completable";
import GameObject from "../../tracker/interfaces/gameObject";

export default class TrackerManager {
    private static instance: TrackerManager;

    private trackerInitialized: boolean;
    private gameCompleted: boolean;
    private tracker: Tracker;
    private accesible: Accessible;
    private alternative: Alternative;
    private completable: Completable;
    private gameObject: GameObject;

    private sceneManager: SceneManager;
    private gameManager: GameManager;

    private day: number;
    private TOTAL_DAYS: number = 7;

    public constructor() {
        this.trackerInitialized = false;
        this.gameCompleted = false;

        try {
            this.tracker = generateTrackerFromURL();
        }
        catch {
            this.tracker = new Tracker(
                new LRS({
                    baseUrl: import.meta.env.VITE_LRS_BASE_URL,
                    authScheme: new BasicAuthentication(
                        import.meta.env.VITE_LRS_USERNAME,
                        import.meta.env.VITE_LRS_PASSWORD
                    ),
                    serializer: (statement: TrackerEvent, version: string) => statement.serializeToXApi(version)
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

    public init() {
        this.sceneManager = SceneManager.getInstance();
        this.gameManager = GameManager.getInstance();
    }

    public static getInstance() {
        TrackerManager.instance = TrackerManager.instance ?? new TrackerManager();
        return TrackerManager.instance;
    }

    sendEnterScene(scene: string, params: { text?: string }) {
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

    sendEnterChat(chatName: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.accesible.accessed(this.accesible.types.screen, "EnterChat");
            evt.result.setExtension("Chat", chatName);
            this.tracker.addEvent(evt);
        }
    }

    sendExitChat(fromChatButton: boolean = true) {
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

    sendStartGame(userInfo: UserInfo) {
        this.day = 1;
        this.TOTAL_DAYS = 7.0;

        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.seriousGame, "GameStart");
            evt.result.setExtension("Gender", userInfo.player);
            evt.result.setExtension("Sexuality", userInfo.sexuality);

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

            let ending = this.gameManager.blackboard.has("routeA") ? "routeA" : "routeB";
            // let explained = this.getValue("explained")
            let explained = this.gameManager.blackboard.get("explained")

            let evt = this.completable.completed(this.completable.types.seriousGame, "GameEnd", 1, true, true);
            evt.result.setExtension("Ending", ending);
            evt.result.setExtension("Explained", explained);
            this.tracker.addEvent(evt);

            this.tracker.close();
        }
    }

    sendItemInteraction(objectName: string, extensions: Record<string, any> = {}, npc: boolean = false) {
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

    sendComputerScreenClick(x: number, y: number) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.gameObject.interacted(this.gameObject.types.item, "ComputerScreenClick");
            evt.result.setExtension("PointerX", x);
            evt.result.setExtension("PointerY", y);
            this.tracker.addEvent(evt);
        }
    }


    sendDialogStarted(nodeId: string, dialogText: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let scene = this.sceneManager.getCurrentScene().scene.key;

            let evt = this.completable.initialized(this.completable.types.storyNode, "DialogStart");
            evt.result.setExtension("Node", scene + "." + nodeId);
            evt.result.setExtension("Dialog", dialogText);
            this.tracker.addEvent(evt);
        }
    }

    sendDialogEnded(nodeId: string, dialogText: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let scene = this.sceneManager.getCurrentScene().scene.key;

            let evt = this.completable.completed(this.completable.types.storyNode, "DialogEnd", 1, true, true);
            evt.result.setExtension("Node", scene + "." + nodeId);
            evt.result.setExtension("Dialog", dialogText);
            this.tracker.addEvent(evt);
        }
    }

    sendWrittenResponse(nodeId: string, response: string, method: string, threshold: number, score: number, matchingText: string, duration: number) {
        if (this.trackerInitialized && !this.gameCompleted) {
            const evt = this.alternative.selected(this.alternative.types.dialogTree, nodeId, response);

            evt.result.setScaledScore(score);
            evt.result.setRawScore(score);
            evt.result.setMinimumScore(0);
            evt.result.setMaximumScore(1);

            evt.result.setSuccess(score >= threshold);

            evt.result.setDuration(duration);

            evt.result.setExtension("Method", method);
            evt.result.setExtension("Threshold", threshold);
            evt.result.setExtension("MatchingText", matchingText);
            this.tracker.addEvent(evt);
        }
    }

    sendChoiceSelected(nodeId: string, choiceText: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let scene = this.sceneManager.getCurrentScene().scene.key;

            let evt = this.alternative.selected(this.alternative.types.dialogTree, "OptionSelect", " ");
            evt.result.setExtension("Node", scene + "." + nodeId);
            evt.result.setExtension("Response", choiceText);

            this.tracker.addEvent(evt);
        }
    }

    sendAnswerFriend(timesListened: number) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.alternative.selected(this.alternative.types.dialogTree, "Day3BreakConversation", " ");
            evt.result.setExtension("TimesListened", timesListened);

            this.tracker.addEvent(evt);
        }
    }

    sendNotificationReceived(chat: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.initialized(this.completable.types.quest, "NotificationReceived");
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }

    sendNotificationsCleared(chat: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let evt = this.completable.completed(this.completable.types.quest, "NotificationSeen", 1, true, true);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }

    sendCanAnswerChat(nodeId: string, chat: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let scene = this.sceneManager.getCurrentScene().scene.key;

            let evt = this.completable.initialized(this.completable.types.quest, "CanAnswerChat");
            evt.result.setExtension("Node", scene + "." + nodeId);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }

    sendAnsweredChat(nodeId: string, chat: string) {
        if (this.trackerInitialized && !this.gameCompleted) {
            let scene = this.sceneManager.getCurrentScene().scene.key;

            let evt = this.completable.completed(this.completable.types.quest, "AnswerChat", 1, true, true);
            evt.result.setExtension("Node", scene + "." + nodeId);
            evt.result.setExtension("Chat", chat);

            this.tracker.addEvent(evt);
        }
    }
}