import { makeRequest } from "./utils.js"

class Authentication {
    async initAuth() { }
    async refreshAuth() { }
    async logout() { }
}

export class BasicAuthentication extends Authentication {
    constructor(username, password) {
        super()
        this.credentials = btoa(username + ":" + password)
        this.auth = "Basic " + this.credentials
    }

    async initAuth() {
        return this.auth
    }

    async refreshAuth() {
        return this.auth
    }
}

export class OAuth2 extends Authentication {
    constructor({ tokenEndpoint, grantType, clientId, scope, state, username, password, loginHint }) {
        super()
        this.tokenEndpoint = tokenEndpoint
        this.logoutEndpoint = tokenEndpoint.replace("/token", "/logout")

        this.grantType = grantType

        this.clientId = clientId
        this.scope = scope
        this.state = state
        this.username = username
        this.password = password
        this.loginHint = loginHint

        this.token = null
        this.refreshTokenInProgress = false
    }

    formatBearerToken(accessToken) {
        return "Bearer " + accessToken
    }

    async initAuth() {
        switch (this.grantType) {
            case "password":
                try {
                    this.token = await this.resourceOwnerPasswordFlow(this.scope, this.state,
                        this.username, this.password, this.loginHint)
                }
                catch (error) {
                    console.error(`Password flow error: ${error.message}`);
                }
            case "code":
                // TODO
                break;
            default:
                console.error(`Unsupported grant type "${this.grantType}". Please use either "code" or "password"`);
        }

        if (this.token) {
            return this.formatBearerToken(this.token.access_token)
        }
        return null
    }

    async refreshAuth() {
        if (!this.refreshTokenInProgress) {
            let form = {
                refresh_token: this.token.refresh_token
            }

            try {
                this.refreshTokenInProgress = true;
                this.token = await this.sendTokenRequest(this.tokenEndpoint, "refresh_token", form)
                this.refreshTokenInProgress = false
                return this.formatBearerToken(this.token.access_token)
            }
            catch (error) {
                this.refreshTokenInProgress = false
                console.error(`Token refresh failed: ${error.message}`)
                return null
            }
        }
        else {
            while (this.refreshTokenInProgress) {
                await new Promise(resolve => setTimeout(resolve, 2000))
            }
        }
    }

    async sendTokenRequest(endpoint, grantType, customForm) {
        let headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        let form = {
            ...customForm,
            grant_type: grantType,
            client_id: this.clientId
        }
        let body = new URLSearchParams(form)

        try {
            return await makeRequest(endpoint, "POST", headers, body)
        }
        catch (error) {
            throw error
        }
    }

    async logout() {
        let form = {
            refresh_token: this.token.refresh_token
        }

        try {
            let response = await this.sendTokenRequest(this.logoutEndpoint, "refresh_token", form)
            return response;
        }
        catch (error) {
            throw error
        }
    }

    async resourceOwnerPasswordFlow(scope, state, username, password, loginHint) {
        let form = {
            username: username,
            password: password,
            login_hint: loginHint
        }
        if (scope) {
            form.scope = scope
        }
        if (state) {
            form.state = state
        }

        try {
            return await this.sendTokenRequest(this.tokenEndpoint, "password", form)
        }
        catch (error) {
            throw error
        }
    }

    // TODO
    async authorizationCodeFlow() {

    }
}