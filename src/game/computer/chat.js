import VerticalListView from "../UI/listView/verticalListView.js"
import MessageBox from "../UI/messageBox.js"

export default class Chat extends Phaser.GameObjects.Container {
    constructor(socialMediaScreen, x, y, pfp, username, width, height, sendDMOnClick) {
        super(socialMediaScreen.scene, 0, 0)

        this.socialMediaScreen = socialMediaScreen

        this.width = width

        const BAR_OFFSET_Y = 10

        let topBar = this.createTopBar(x, y + BAR_OFFSET_Y, pfp, username)

        this.bottomBar = this.createBottomBar(x, y + height - BAR_OFFSET_Y, sendDMOnClick)

        this.listView = this.createChat(x, topBar.y + topBar.bar.displayHeight, width, 
            height - BAR_OFFSET_Y * 2 - topBar.bar.displayHeight - this.bottomBar.displayHeight)

        this.visible = false;
    }

    createChat(x, y, width, height) {
        const PADDING = -40
        const END_PADDING = 15
        
        let listView = new VerticalListView(this.scene, x, y,
            1, PADDING, { width: width, height: height }, null, false, END_PADDING, true);
        this.add(listView)

        return listView
    }

    addMessage(text, character, name) {
        let msg = new MessageBox(this.scene, text, character, name, 0, this.width);
        this.listView.addLastItem(msg)
    }

    createTopBar(x, y, pfp, username) {
        let container = this.scene.add.container(x, y)

        let bar = this.scene.add.image(0, 0, 'chatBar')
        bar.setOrigin(0.5, 0)
        container.add(bar)

        const PROFILE_OFFSET_X = 10
        const PROFILE_SCALE = 0.63

        let profile = this.socialMediaScreen.createImageWithSideText(-bar.displayWidth / 2 + PROFILE_OFFSET_X, 
            bar.displayHeight / 2, pfp, username, PROFILE_SCALE)
        profile.x += profile.width / 2
        container.add(profile)

        this.add(container)

        // Propiedades
        container.bar = bar
        container.profile = profile

        return container
    }

    createBottomBar(x, y, sendDMOnClick) {
        let bar = this.scene.add.image(x, y, 'sendDirectMessage')
        bar.setOrigin(0.5, 1)

        this.scene.turnIntoButtonInteractionAnim(bar, bar, sendDMOnClick, this.scene.colors.white.rgb, this.scene.colors.blue0.rgb, 
            this.scene.colors.blue1.rgb)

        this.add(bar)

        return bar
    }

    restartChatAnim() {
        this.bottomBar.restartInteractionAnim()
    }
}