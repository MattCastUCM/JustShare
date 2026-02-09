export class Actor {
    constructor(name) {
        this.name = name

    }

    serializeToXApi(version) {
        let actor = {}
        if (this.name) {
            actor.name = this.name
        }
        return actor
    }
}

export class EmailActor extends Actor {
    constructor(email, name = null) {
        super(name)
        this.email = email
    }

    serializeToXApi(version) {
        let actor = super.serializeToXApi(version)
        return {
            ...actor,
            mbox: "mailto:" + this.email,
            objectType: "Agent"
        }
    }
}

export class AccountActor extends Actor {
    constructor(homePage, accountName, name = null) {
        super(name)
        this.homePage = homePage
        this.accountName = accountName
    }

    serializeToXApi(version) {
        let actor = super.serializeToXApi(version)
        return {
            ...actor,
            account: {
                homePage: this.homePage,
                name: this.accountName
            }
        }
    }
}