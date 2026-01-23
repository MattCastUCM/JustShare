export default class Result {
    constructor(rootId) {
        this.rootId = rootId;

        this.scaledScore = null;
        this.rawScore = null;
        this.minimumScore = null;
        this.maximumScore = null;

        this.success = null;
        this.completion = null;

        this.response = null;

        this.duration = null;

        this.extensions = {};

        this.types = {
            health: "health",
            position: "position",
            progress: "progress",
        };

        this.ids = {
            health: 'https://w3id.org/xapi/seriousgames/extensions/health',
            position: 'https://w3id.org/xapi/seriousgames/extensions/position',
            progress: 'https://w3id.org/xapi/seriousgames/extensions/progress'
        };
    }

    setExtension(key, value) {
        let id = null;
        if (this.ids.hasOwnProperty(key)) {
            id = this.ids[key];
        }
        else {
            id = this.rootId + "/" + key;
        }
        this.extensions[id] = value;
    }

    setScaledScore(scaledScore) {
        this.scaledScore = scaledScore;
    }

    setRawScore(rawScore) {
        this.rawScore = rawScore;
    }

    setMinimumScore(minimumScore) {
        this.minimumScore = minimumScore;
    }

    setMaximumScore(maximumScore) {
        this.maximumScore = maximumScore;
    }

    setSuccess(success) {
        this.success = success;
    }

    setCompletion(completion) {
        this.completion = completion;
    }

    setResponse(response) {
        this.response = response;
    }

    setDuration(duration) {
        this.duration = duration;
    }

    isEmpty() {
        return this.scaledScore == null &&
            this.rawScore == null &&
            this.minimumScore == null &&
            this.maximumScore == null &&
            this.success == null &&
            this.completion == null &&
            this.response == null &&
            this.duration == null &&
            Object.keys(this.extensions).length == 0
    }

    convertDurationToISO8601(duration) {
        let seconds = duration % 60;
        let minutes = Math.floor(duration / 60) % 60;
        let hours = Math.floor(duration / 3600) % 24;
        let days = Math.floor(duration / 86400);

        // Construct the ISO 8601 duration string
        let isoDuration = `P${days}DT${hours}H${minutes}M${seconds}S`;
        return isoDuration;
    }

    serializeToXApi(version) {
        let result = {};

        if (this.scaledScore || this.rawScore || this.minimumScore || this.maximumScore) {
            let score = {}
            if (this.scaledScore) {
                score.scaled = Number(this.scaledScore);
            }
            if (this.rawScore) {
                score.raw = Number(this.rawScore);
            }
            if (this.minimumScore) {
                score.min = Number(this.minimumScore);
            }
            if (this.maximumScore) {
                score.max = Number(this.maximumScore);
            }
            result.score = score
        }

        if (this.success != null) {
            result.success = this.success ? true : false;
        }

        if (this.completion != null) {
            result.completion = this.completion ? true : false;
        }

        if (this.response) {
            result.response = this.response;
        }

        if (this.duration) {
            result.duration = this.convertDurationToISO8601(this.duration);
        }

        if (Object.keys(this.extensions).length > 0) {
            result.extensions = this.extensions;
        }

        return result;
    }
}