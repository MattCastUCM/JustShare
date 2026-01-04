import Tracker from './tracker.js'
import LRS from './lrs.js';
import { AccountActor } from './statement/actor.js';
import { OAuth2 } from './authentication.js';
import ms from './lib/ms.js'

export function generateTrackerFromURL() {
    let urlParams = new URLSearchParams(window.location.search);

    let resultUri = null;

    // let batchLength = 100;
    // let batchTimeout = 180000;

    let backupUri = null;
    // let backupType = "XAPI"

    let actorHomepage = null;
    let actorUsername = null;

    let authConfig = {}

    if (urlParams.size > 0) {
        resultUri = urlParams.get('result_uri');

        // batchLength = urlParams.get('batch_length');
        // batchTimeout = urlParams.get('batch_timeout');
        // batchTimeout = ms(batchTimeout)

        backupUri = urlParams.get('backup_uri');
        // backupType = urlParams.get('backup_type');

        actorHomepage = urlParams.get('actor_homepage');
        actorUsername = urlParams.get('actor_user');

        let ssoTokenEndpoint = urlParams.get('sso_token_endpoint');
        if (ssoTokenEndpoint) {
            authConfig.tokenEndpoint = ssoTokenEndpoint;
        }
        let ssoClientId = urlParams.get('sso_client_id');
        if (ssoClientId) {
            authConfig.clientId = ssoClientId;
        }
        let ssoLoginHint = urlParams.get('sso_login_hint');
        if (ssoLoginHint) {
            authConfig.loginHint = ssoLoginHint;
        }
        let ssoGrantType = urlParams.get('sso_grant_type');
        if (ssoGrantType) {
            authConfig.grantType = ssoGrantType;
        }
        let ssoScope = urlParams.get('sso_scope');
        if (ssoScope) {
            authConfig.scope = ssoScope;
        }
        let ssoUsername = urlParams.get('sso_username');
        if (ssoUsername) {
            authConfig.username = ssoUsername;
        }
        let ssoPassword = urlParams.get('sso_password');
        if (ssoPassword) {
            authConfig.password = ssoPassword;
        }
        else if (ssoUsername) {
            authConfig.password = ssoUsername;
        }
    }

    return new Tracker(
        new LRS({
            baseUrl: resultUri,
            authScheme: new OAuth2(authConfig),
            serializer: (statement, version) => statement.serializeToXApi(version),
            backup: {
                endpoint: backupUri,
                serializer: (statement, version) => JSON.stringify(statement.serializeToXApi(version))
            }
        }),
        new AccountActor(actorHomepage, actorUsername)
    )
}
