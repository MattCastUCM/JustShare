import VerticalListView from '../UI/listView/verticalListView.js';
import DualPost from './dualPost.js';
import BaseScreen from './baseScreen.js'
import DirectChat from './directChat.js';

export default class SocialMediaScreen extends BaseScreen {
    constructor(scene) {
        super(scene, 'socialMediaScreen')

        this.SCREEN_LEFT_SIDE_X = 246
        this.FIRST_LINE_X = 468
        this.SECOND_LINE_X = 1046

        this.TOP_BAR_BOTTOM_Y = 111
        this.SCREEN_HEIGHT = 629
        this.TASK_BAR_TOP_Y = this.TOP_BAR_BOTTOM_Y + this.SCREEN_HEIGHT

        this.FEED_WIDTH = (this.SECOND_LINE_X - this.FIRST_LINE_X)
        this.FEED_CENTER_X = this.FIRST_LINE_X + this.FEED_WIDTH / 2

        this.ZONE_HEADER_HEIGHT = 55
        this.ZONE_HEADER_BOTTOM_Y = this.TOP_BAR_BOTTOM_Y + this.ZONE_HEADER_HEIGHT
        this.ZONE_HEADER_CENTER_Y = this.ZONE_HEADER_BOTTOM_Y - this.ZONE_HEADER_HEIGHT / 2

        this.ZONE_HEIGHT = this.TASK_BAR_TOP_Y - this.ZONE_HEADER_BOTTOM_Y

        this.MENU_ZONE_WIDTH = this.FIRST_LINE_X - this.SCREEN_LEFT_SIDE_X
        this.MENU_ZONE_CENTER_X = this.SCREEN_LEFT_SIDE_X + this.MENU_ZONE_WIDTH / 2

        this.CONTACT_ZONE_WIDTH = 307
        this.CONTACT_ZONE_CENTER_X = this.SECOND_LINE_X + this.CONTACT_ZONE_WIDTH / 2

        // Feed
        this.posts = new Map();

        this.pfpsFile = this.scene.cache.json.get('profilePictures');

        this.feedListView = this.createFeed(this.FEED_CENTER_X, this.TOP_BAR_BOTTOM_Y, this.FEED_WIDTH,
            this.SCREEN_HEIGHT, this.POST_WIDTH)

        // Mensajes directos
        this.directChats = new Map();

        this.createDirectMessageTitle(this.CONTACT_ZONE_CENTER_X, this.ZONE_HEADER_CENTER_Y, [0.5, 0.5])

        this.contactZoneListview = this.createDmZone(this.CONTACT_ZONE_CENTER_X, this.ZONE_HEADER_BOTTOM_Y,
            this.CONTACT_ZONE_WIDTH, this.ZONE_HEIGHT)

        // Iconos menu izquierda
        this.createMenu(() => {
            // TRACKER EVENT
            // console.log("Pulsar boton de inicio");
            this.scene.gameManager.sendItemInteraction("homeButton");

            this.reset()
        })
    }

    reset() {
        this.setSelectedPostsVisible(false)
        this.setChatsVisible(false)
        this.setFeedVisible(true)
    }

    /////////////////////////////////////////////
    //////// Metodos para zona del menu /////////
    /////////////////////////////////////////////

    createMenu(homeOnClick) {
        const PROFILE_SCALE = 0.75
        const PROFILE_OFFSET_Y = 30

        let profile = this.createImageWithSideText(this.MENU_ZONE_CENTER_X, this.TOP_BAR_BOTTOM_Y + this.ZONE_HEADER_HEIGHT + PROFILE_OFFSET_Y,
            "unknownPfp", this.username, PROFILE_SCALE)
        profile.y += profile.height / 2
        this.add(profile)

        const ICON_SCALE = 0.64
        const ICON_OFFSET_Y = 18
        const HOME_ICON_HEIGHT = 70

        // Iconos de casa
        let homeIcon = this.createHomeIcon(profile.x, profile.y + profile.height / 2 + HOME_ICON_HEIGHT / 2 + ICON_OFFSET_Y,
            "homeIcon", ICON_SCALE, this.MENU_ZONE_WIDTH, HOME_ICON_HEIGHT, homeOnClick)

        // Icono de opciones
        let optionsIcon = this.createImageWithSideTranslation(homeIcon.x, homeIcon.y + homeIcon.height / 2,
            "optionsIcon", "optionsIcon", ICON_SCALE)
        optionsIcon.y += optionsIcon.height / 2
        this.add(optionsIcon)

        let diffWidth = optionsIcon.width - homeIcon.icon.width
        homeIcon.icon.x -= diffWidth / 2

        const BUTTON_SCALE = 0.48
        const BUTTON_OFFSET_Y = 80

        // Boton para subir un post
        let generalDialogsId = 'generalDialogs'
        let generalNodes = this.scene.cache.json.get(generalDialogsId);
        let noPostNode = this.scene.readNodes(generalNodes, generalDialogsId, "post", true);

        let button = this.scene.createButton(profile.x, this.TASK_BAR_TOP_Y - BUTTON_OFFSET_Y, "shareButton", () => {
            this.scene.dialogManager.setNode(noPostNode, [])

            // TRACKER EVENT
            // console.log("Pulsar boton de compartir");
            this.scene.gameManager.sendItemInteraction("shareButton");

        }, BUTTON_SCALE)
        button.y -= button.height / 2
        this.add(button)
    }

    createHomeIcon(x, y, transId, iconScale, width, height, onClick) {
        let container = this.scene.add.container(x, y)

        let icon = this.createImageWithSideTranslation(0, 0, "homeIcon", transId, iconScale)
        container.add(icon)

        let bg = this.scene.add.rectangle(0, 0, width, height, this.scene.colors.white.hex.get0x)
        bg.setTint = function (color) {
            this.setFillStyle(color)
        }
        bg.setOrigin(0.5, 0.5)
        this.scene.turnIntoButtonColorAnim(bg, bg, onClick, this.scene.colors.white.rgb, this.scene.colors.blue0.rgb, this.scene.colors.blue1.rgb)

        container.add(bg)

        container.bringToTop(icon)

        this.add(container)

        // Propiedades
        container.setSize(width, bg.displayHeight)
        container.icon = icon

        return container
    }

    ///////////////////////////////////////
    //////// Metodos para los dms /////////
    //////////////////////////////////////

    createDirectMessageTitle(x, y, origin = [0, 0]) {
        let style = { ...this.scene.style }
        style.color = this.scene.colors.white.hex.getNumberSign
        style.fontSize = '28px'

        let translation = this.scene.translate("messagesTitle")

        let title = this.scene.add.text(x, y, translation, style);
        title.setOrigin(origin[0], origin[1])

        this.add(title)
    }

    createDmZone(x, y, width, height) {
        let listView = new VerticalListView(this.scene, x, y,
            1, 0, { width: width, height: height }, null, true);

        this.add(listView)

        return listView
    }

    addDirectChat(usernameId) {
        const DIRECT_MESSAGE_HEIGHT = 72

        if (!this.directChats.has(usernameId)) {
            let pfp = this.pfpsFile[usernameId]
            let username = this.scene.translateWithNamespace(usernameId, this.NAMESPACE_PREFIX + 'usernames')

            let directChat = new DirectChat(this, this.FEED_CENTER_X, this.TOP_BAR_BOTTOM_Y, pfp, username,
                [this.FEED_WIDTH, this.SCREEN_HEIGHT], [this.CONTACT_ZONE_WIDTH, DIRECT_MESSAGE_HEIGHT])

            this.add(directChat.chat)

            this.directChats.set(usernameId, directChat)

            this.contactZoneListview.addLastItem(directChat.contact, directChat.contact.hits)
        }
    }

    setChatNode(usernameId, node) {
        if (this.directChats.has(usernameId)) {
            let directchat = this.directChats.get(usernameId)
            directchat.setChatNode(node)
        }
    }

    setChatsVisible(enable) {
        this.directChats.forEach((value, key) => {
            value.setChatVisible(enable)
        });
    }

    clearChatNotifications(usernameId) {
        if (this.directChats.has(usernameId)) {
            let directchat = this.directChats.get(usernameId)
            directchat.clearNotifications()
        }
    }

    ///////////////////////////////////////
    //////// Metodos para el feed /////////
    //////////////////////////////////////

    focusOnFirstPost() {
        this.feedListView.focusOnFirstItem()
    }

    createFeed(x, y, width, height) {
        const PADDING = 50
        const END_PADDING = 20

        let listView = new VerticalListView(this.scene, x, y,
            1, PADDING, { width: width, height: height }, null, true, END_PADDING, false);

        this.add(listView)

        return listView
    }

    addPost(postId, usernameId, picture) {
        const POST_WIDTH = 430
        const SELECTED_POST_OFFSET_Y = 10

        if (!this.posts.has(postId)) {
            let pfp = this.pfpsFile[usernameId]
            let username = this.scene.translateWithNamespace(usernameId, this.NAMESPACE_PREFIX + 'usernames')
            let caption = this.scene.translateWithNamespace(postId, this.NAMESPACE_PREFIX + 'captions', {
                name: this.scene.gameManager.getUserInfo().name,
            })

            let post = new DualPost(this, this.FEED_CENTER_X, this.TOP_BAR_BOTTOM_Y + SELECTED_POST_OFFSET_Y, pfp, username,
                caption, picture, POST_WIDTH, this.TASK_BAR_TOP_Y)

            this.posts.set(postId, post)

            this.add(post.selected)

            this.feedListView.addFirstItem(post.feed, post.feed.hits)
        }
    }

    falsifyCommentaries(postId, nCommentaries) {
        if (this.posts.has(postId)) {
            let post = this.posts.get(postId)
            post.falsifyCommentaries(nCommentaries)
        }
    }

    setCommentaryNode(postId, node) {
        if (this.posts.has(postId)) {
            let post = this.posts.get(postId)
            post.setCommentaryNode(node)
        }
    }

    setSelectedPostsVisible(enable) {
        this.posts.forEach((value, key) => {
            value.setSelectedPostVisible(enable)
        });
    }

    setFeedVisible(enable) {
        this.feedListView.setVisible(enable)
    }

    setFeedAndPostsVisible(enable) {
        this.setFeedVisible(enable)
        this.setSelectedPostsVisible(enable)
    }

    ///////////////////////////////////////
    ///////// Metodos de utilidad /////////
    //////////////////////////////////////

    createImageWithSideText(x, y, img, text, scale = 1, origin = [0.5, 0.5]) {
        const OFFSET_X = 10
        const IMAGE_SCALE_MULTIPLIER = 1.6

        let container = this.scene.add.container(x, y)

        let style = { ...this.scene.style }
        style.fontSize = '37px'

        let textObject = this.scene.add.text(0, 0, text, style);
        textObject.setOrigin(0, 0)
        container.add(textObject)

        let image = this.scene.add.image(textObject.x - OFFSET_X, textObject.y + textObject.displayHeight / 2, img)
        image.setOrigin(1, 0.5)
        let imageHeight = textObject.displayHeight * IMAGE_SCALE_MULTIPLIER
        let imageScale = imageHeight / image.displayHeight
        image.setScale(imageScale)
        container.add(image)

        container.setScale(scale)

        // Propiedades
        let bounds = container.getBounds()
        let width = (image.displayWidth + OFFSET_X + textObject.displayWidth) * scale
        container.setSize(width, bounds.height)
        container.image = image
        container.text = textObject

        if (origin[0] == 0.5 && origin[1] == 0.5) {
            let oldCenterX = (image.displayWidth + OFFSET_X) * scale
            let newCenterX = width / 2
            let oldCenterY = (Math.abs(imageHeight - textObject.displayHeight)) / 2 * scale
            this.alignContainerItems(container, oldCenterX, newCenterX, oldCenterY, bounds.height / 2)
        }
        else if (origin[0] == 0 && origin[1] == 0.5) {
            let oldCenterX = (image.displayWidth + OFFSET_X) * scale
            let oldCenterY = (Math.abs(imageHeight - textObject.displayHeight)) / 2 * scale
            this.alignContainerItems(container, oldCenterX, 0, oldCenterY, bounds.height / 2)
        }

        return container
    }

    createImageWithSideTranslation(x, y, img, transId, scale = 1) {
        let translate = this.scene.translate(transId)
        return this.createImageWithSideText(x, y, img, translate, scale)
    }

    alignContainerItems(container, oldCenterX, newCenterX, oldCenterY, newCenterY) {
        // Centrar elmentos
        let diffX = oldCenterX - newCenterX;
        let diffY = oldCenterY - newCenterY

        container.list.forEach((item) => {
            item.x += diffX / container.scale
            item.y += diffY / container.scale
        });
    }
}