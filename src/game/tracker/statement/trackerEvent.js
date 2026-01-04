import { generateUUID } from "../utils.js";

export default class TrackerEvent {
    constructor({ actor, verb, object, result, context }) {
        this.id = generateUUID();
        this.timestamp = new Date().toISOString();

        this.actor = actor
        this.verb = verb;
        this.object = object;
        this.context = context;
        this.result = result;
    }

    serializeToXApi(version) {
        let event = {
            timestamp: this.timestamp,
            id: this.id,
            version: version,
            actor: this.actor.serializeToXApi(version),
            verb: this.verb.serializeToXApi(version),
            object: this.object.serializeToXApi(version),
            context: this.context.serializeToXApi(version)
        }

        if (this.result && !this.result.isEmpty()) {
            event.result = this.result.serializeToXApi(version);
        }

        return event;
    }
}
