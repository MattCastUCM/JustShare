export default class Alternative {
    constructor(tracker) {
        this.tracker = tracker;

        this.types = {
            question: 0,
            menu: 1,
            dialogTree: 2,
            path: 3,
            arena: 4,
            alternative: 5,

            properties: ["question", "menu", "dialog-tree", "path", "arena", "alternative"]
        }

        this.ids = {
            question: 'http://adlnet.gov/expapi/activities/question',
            menu: 'https://w3id.org/xapi/seriousgames/activity-types/menu',
            "dialog-tree": 'https://w3id.org/xapi/seriousgames/activity-types/dialog-tree',
            // No existe en el registro
            path: 'https://w3id.org/xapi/seriousgames/activity-types/path',
            // No existe en el registro
            arena: 'https://w3id.org/xapi/seriousgames/activity-types/arena',
            // No existe en el registro
            alternative: 'https://w3id.org/xapi/seriousgames/activity-types/alternative'
        };

        this.descriptions = {
            question: 'A question is typically part of an assessment and requires a response from the learner, a response that is then evaluated for correctness.',
            menu: 'A menu with several buttons/options whose selection produces different effects. Represents a menu, integrated in the user interface (UI), with several a options.',
            "dialog-tree": "An alternative presented during a conversation with an non-playable character. Dialog trees are a common mechanic in video games, where players can answer questions to NPC. This activity represents that type of alternative.",
            path: " ",
            arena: " ",
            alternative: " "
        };
    }

    selected(type, alternativeId, response) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'https://w3id.org/xapi/adb/verbs/selected',
                type: "selected"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: alternativeId,
            },
        });
        event.result.setResponse(response);
        return event;
    }

    unlocked(type, alternativeId, response) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'https://w3id.org/xapi/seriousgames/verbs/unlocked',
                type: "unlocked"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: alternativeId,
            }
        });
        event.result.setResponse(response);
        return event;
    }
}