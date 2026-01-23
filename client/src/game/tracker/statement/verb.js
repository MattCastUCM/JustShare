export default class Verb {
    constructor({ id, type }) {
        this.id = id;
        this.type = type
    }

    serializeToXApi(version) {
        return {
            id: this.id,
            display: { "en-US": this.type }
        }
    }
}