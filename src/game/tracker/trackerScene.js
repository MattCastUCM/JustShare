import Tracker from './tracker.js'
import LRS from './lrs.js';
import { AccountActor } from './statement/actor.js';
import { BasicAuthentication, OAuth2 } from './authentication.js';
import { generateTrackerFromURL } from './index.js';

export default class TrackerScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TrackerScene' })
    }

    create() {
        let tracker = new Tracker(
            new LRS({
                baseUrl: "https://cloud.scorm.com/lrs/YQFKDDG1H6/sandbox/",
                authScheme: new BasicAuthentication("oMsoz51hM_OQbNNR3Nk", "LfWapsOhe1V-ryV2C6o"),
                serializer: (statement, version) => statement.serializeToXApi(version)
            }),
            new AccountActor("http://example.com", "TestActor")
        );

        // var tracker = new Tracker(
        //     new LRS({
        //         baseUrl: "https://simva-api.simva-beta.e-ucm.es/activities/681b46a0fbe4c00023c56cc4/",
        //         authScheme: new OAuth2({
        //             tokenEndpoint: "https://sso.simva-beta.e-ucm.es/realms/simva/protocol/openid-connect/token",
        //             grantType: "password",
        //             clientId: "simva-plugin",
        //             password: "slpa",
        //             username: "slpa",
        //             loginHint: "6818e70cfbe4c00023c50ab4"
        //         }),
        //         backup: {
        //             endpoint: "https://simva-api.simva-beta.e-ucm.es:443/activities/681b46a0fbe4c00023c56cc4/result",
        //             type: "XAPI"
        //         }
        //     }),
        //     new AccountActor("http://example.com", "holita")
        // )

        // var tracker = generateTrackerFromURL()

        var completable = tracker.completable
        var gameObject = tracker.gameObject
        var accesible = tracker.accesible
        var alternative = tracker.alternative

        // let event = completable.completed(completable.types.area, "hola", 0.1, true, true, 1000)
        // let event = alternative.selected(alternative.types.dialogTree, "hola", "juan")
        let event = gameObject.interacted(gameObject.types.gameObject, "hola")
        event.result.setExtension("numero", 2)
        tracker.addEvent(event);

        setTimeout(() => {
            tracker.sendEvents()
        }, 2000);
    }
}