export default class Completable {
    constructor(tracker) {
        this.tracker = tracker;

        this.types = {
            seriousGame: 0,
            game: 1,
            area: 2,
            level: 3,
            quest: 4,
            stage: 5,
            combat: 6,
            session: 7,
            storyNode: 8,
            completable: 9,

            properties: ["serious-game", "game", "area", "level", "quest", "stage", "combat", "session", "story-node", "completable"]
        }

        this.ids = {
            "serious-game": 'https://w3id.org/xapi/seriousgames/activity-types/serious-game',
            game: 'http://activitystrea.ms/game',
            area: 'https://w3id.org/xapi/seriousgames/activity-types/area',
            level: 'https://w3id.org/xapi/seriousgames/activity-types/level',
            quest: 'https://w3id.org/xapi/seriousgames/activity-types/quest',
            // No existe en el registro
            stage: 'https://w3id.org/xapi/seriousgames/activity-types/stage',
            // No existe en el registro
            combat: 'https://w3id.org/xapi/seriousgames/activity-types/combat',
            // No existe en el registro
            race: 'https://w3id.org/xapi/seriousgames/activity-types/race',
            // No existe en el registro
            session: 'https://w3id.org/xapi/seriousgames/activity-types/session',
            // No existe en el registro
            "story-node": 'https://w3id.org/xapi/lab/activity-types/story-node',
            // No existe en el registro
            completable: 'https://w3id.org/xapi/seriousgames/activity-types/completable'
        };

        this.descriptions = {
            "serious-game": "A collectable game object whose use or interaction results in an effect in a game. Items are common elements in video games. Players can collect/use/combine them.",
            game: "Represents a game or competition of any kind.",
            area: "An identified area inside the game world. In some games they can also be worlds. Represents an aggregation of zones.	",
            level: "A level of a game or of a gamified learning platform. A level is logic partition of progression in any video game. Completing a level means advancing in the progression of the game.",
            quest: "A accomplishable challenge or mission presented inside a game. Completing quests marks the players' progress.",
            stage: " ",
            combat: " ",
            race: " ",
            session: " ",
            "story-node": " ",
            completable: " "
        }
    }

    initialized(type, completableId) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/initialized',
                type: "initialized"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: completableId,
            }
        });

        return event;
    }

    progressed(type, completableId, scaledScore) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/progressed',
                type: "progressed"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: completableId,
            }
        });

        event.result.setScaledScore(scaledScore);

        return event;
    }

    completed(type, completableId, scaledScore, completion, success, duration = null) {
        let property = this.types.properties[type]

        let event = this.tracker.createEvent({
            verb: {
                id: 'http://adlnet.gov/expapi/verbs/completed',
                type: "completed"
            },
            object: {
                id: this.ids[property],
                type: property,
                description: this.descriptions[property],
                specificId: completableId,
            }
        });

        event.result.setScaledScore(scaledScore);
        event.result.setCompletion(completion);
        event.result.setSuccess(success);

        if (duration) {
            event.result.setDuration(duration);
        }

        return event;
    }
}
