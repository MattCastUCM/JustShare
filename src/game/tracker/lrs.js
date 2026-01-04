import { makeRequest } from './utils.js'

class Persistance {
    constructor(serializer) {
        this.serializer = serializer
    }

    async logout() { }

    async saveStatements(statements) { }
}

class Versions {
    static getAllVersions() {
        return [
            "1.0.2",
            "1.0.1",
            "1.0.0",
            "0.95",
            "0.9"
        ];
    }

    static isValidVersion(version) {
        return this.getAllVersions().includes(version);
    }
}

export default class LRS extends Persistance {
    constructor({ baseUrl, authScheme, serializer, version = null, backup = null }) {
        super(serializer)

        this.baseUrl = String(baseUrl)
        if (this.baseUrl.slice(-1) !== "/") {
            this.baseUrl += "/"
        }
        this.endpoint = "statements"

        this.authScheme = authScheme
        this.auth = null
        this.online = false
        this.initAuth()

        if (version) {
            if (!Versions.isValidVersion(version)) {
                console.error(`LRS not supported: invalid version (${version})`);
                this.version = Versions.getAllVersions()[0];
            }
            else {
                this.version = version
            }
        }
        else {
            this.version = Versions.getAllVersions()[0];
        }

        this.backup = backup
    }

    async initAuth() {
        this.onOffline()
        this.auth = await this.authScheme.initAuth()
        if (this.auth) {
            this.onOnline()
        }
    }

    async refreshAuth() {
        this.onOffline()
        this.auth = await this.authScheme.refreshAuth()
        if (this.auth) {
            this.onOnline()
        }
    }

    async logout() {
        try {
            let response = await this.authScheme.logout();
            console.log("Logout successfully");
            this.authScheme = null;
            return response;
        }
        catch (error) {
            console.log(`Logout failed ${error.message}`);
        }
        finally {
            this.onOffline();
        }
    }

    onOnline() {
        this.online = true
    }

    onOffline() {
        this.offline = false
    }

    buildHeaders(customHeaders) {
        let headers = {
            ...customHeaders,
            "Content-Type": "application/json",
            Authorization: this.auth,
        }

        return headers
    }

    async sendRequest(endpoint, method, customHeaders, statementsXApi) {
        let fullUrl;
        if (endpoint.startsWith("http")) {
            fullUrl = endpoint
        }
        else {
            fullUrl = this.baseUrl + endpoint
        }

        let headers = this.buildHeaders(customHeaders)
        let body = JSON.stringify(statementsXApi, null, 2)

        try {
            return await makeRequest(fullUrl, method, headers, body)
        }
        catch (error) {
            throw error
        }
    }

    async sendBackup(statements) {
        if (this.online && this.backup && this.backup.endpoint && this.backup.serializer) {
            let statementsXApi = statements.map(statement => this.backup.serializer(statement, this.version));

            // switch (this.backup.type) {
            //     case 'XAPI':
            //         statementsXApi = statements.map(statement => JSON.stringify(statement.serializeToXApi(this.version)));
            //         contentType = 'application/json';
            //         break;
            //     default:
            //         return;
            // }

            let body = {
                tofile: true,
                result: statementsXApi.join('\n'),
                contentType: 'application/json'
            };

            try {
                let response = await this.sendRequest(this.backup.endpoint, "POST", null, body)
                console.log(response)
            }
            catch (error) {
                await this.handleAuthError(error, statements)
                throw error
            }
        }
    }

    async handleAuthError(error, statements) {
        if (error.response) {
            let status = error.response.status;
            let message = error.message;

            switch (status) {
                // Unauthorized
                case 401:
                    console.error(`Unauthorized: ${message}`);
                    await this.refreshAuth();
                    await this.sendBackup(statements);
                    break;
                // Forbidden
                case 403:
                    console.error(`Forbidden: ${message}`);
                    await this.refreshAuth();
                    await this.sendBackup(statements);
                    break;
            }
        }
    }

    async saveStatements(statements) {
        if (this.online) {
            let headers = {}
            if (this.version !== "0.9") {
                headers["X-Experience-API-Version"] = this.version;
            }

            if (statements.length !== 0) {
                // let statementsXApi = statements.map(statement => statement.serializeToXApi(this.version))
                let statementsXApi = statements.map(statement => this.serializer(statement, this.version))

                try {
                    return await this.sendRequest("statements", "POST", headers, statementsXApi)
                }
                catch (error) {
                    await this.handleAuthError(error, statements)
                    throw error
                }
            }
        }
        else {
            throw new Error("Device is offline, cannont save statements");
        }
    }
}
