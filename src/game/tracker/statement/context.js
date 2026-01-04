import { generateUUID } from "../utils.js";

export default class Context {
    constructor(id) {
        this.registration = generateUUID();
        this.id = id;
    }

    serializeToXApi(version) {
        return {
            registration: this.registration,
            contextActivities: {
                category: [{
                    id: this.id
                }]
            }
        };
    }
}