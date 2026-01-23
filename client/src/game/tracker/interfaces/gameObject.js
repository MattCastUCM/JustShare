export default class GameObject {
    constructor(tracker) {
        this.tracker = tracker;

        this.types = {
            item: 0,
            npc: 1,
            gameObject: 2,

            properties: ["item", "non-player-character", "game-object"]
        }

        this.ids = {
            item: 'https://w3id.org/xapi/seriousgames/activity-types/item',
            "non-player-character": 'https://w3id.org/xapi/seriousgames/activity-types/non-player-character',
            "game-object": "https://w3id.org/xapi/seriousgames/activity-types/game-object"
        };

        this.descriptions = {
            item: "A collectable game object whose use or interaction results in an effect in a game. Items are common elements in video games. Players can collect/use/combine them.",
            "non-player-character": "A character that can offer a conversation or other type of interaction inside a game. Players usually have conversations with non-player characters.",
            "game-object": " "
        }
    }

    interacted(type, gameObjectId) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/interacted',
                type: "interacted"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: gameObjectId,
            }
        });
        return event;
    }

    used(type, gameObjectId) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'https://w3id.org/xapi/seriousgames/verbs/used',
                type: "used"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: gameObjectId,
            }
        });
        return event;
    }
}
