import Accesible from "./interfaces/accessible.js"
import Alternative from "./interfaces/alternative.js"
import Completable from "./interfaces/completable.js";
import GameObject from "./interfaces/gameObject.js";
import TrackerEvent from "./statement/trackerEvent.js";
import Verb from './statement/verb.js'
import Object from "./statement/object.js";
import Context from "./statement/context.js";
import Result from "./statement/result.js";

export default class Tracker {
    constructor(lrs, actor, batchLength = 100, batchTimeout = 180000) {
        this.pendingQueue = [];
        this.sendingQueue = [];

        this.rootId = "https://w3id.org/xapi/seriousgame"

        this.lrs = lrs;
        this.actor = actor;
        this.context = new Context(this.rootId);

        this.batchLength = batchLength;
        this.batchTimeout = batchTimeout;

        this.accesible = new Accesible(this);
        this.alternative = new Alternative(this);
        this.completable = new Completable(this);
        this.gameObject = new GameObject(this);
        this.sending = false;

        window.addEventListener('beforeunload', async () => {
            await this.close();
        });

        this.timer = null;
        this.resetTimer();

        // TRACKER EVENT
        // console.log("Inicio de sesion") 
        let event = this.completable.initialized(this.completable.types.session, "SessionStart");
        this.addEvent(event);
    }

    resetTimer() {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            this.sendEvents();
        }, this.batchTimeout);
    }

    async close() {
        // TRACKER EVENT
        // console.log("Cierre de sesion")
        let event = this.completable.completed(this.completable.types.session, "SessionEnd", 1, true, true);
        this.addEvent(event);

        while (this.sending && this.pendingQueue.length > 0) {
            console.log("Waiting for pending events to be sent before closing...");
        }

        await this.sendEvents();

        // Se cierra la sesion para que el usuario tenga que volvera a iniciarla
        await this.lrs.logout();
    }

    // Agregar un evento a la cola
    createEvent(params) {
        let eventParams = {
            actor: this.actor,
            verb: new Verb(params.verb),
            object: new Object(params.object),
            context: this.context,
            result: new Result(this.rootId + "/extensions")
        }

        let event = new TrackerEvent(eventParams);
        return event
    }

    addEvent(event) {
        this.pendingQueue.push(event);
        if (this.pendingQueue.length >= this.batchLength) {
            this.sendEvents();
        }
    }

    async sendEvents() {
        this.resetTimer();

        if (!this.sending && this.pendingQueue.length > 0) {
            this.sendingQueue.push(...this.pendingQueue);
            this.pendingQueue = [];

            try {
                console.log(`Sending ${this.sendingQueue.length} events`);
                let response = await this.lrs.saveStatements(this.sendingQueue);
                console.log(response);
                this.sendingQueue = [];
                return response;
            }
            catch (error) {
                console.error(error.message);
            }
            finally {
                this.sending = false;
            }
        }
    }
}
