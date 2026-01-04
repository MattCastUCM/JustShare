import Post from "./post.js";
import VerticalListView from "../UI/listView/verticalListView.js";

export default class SelectedPost extends Post {
    constructor(socialMediaScreen, x, y, pfp, username, caption, picture, width, zoneBottomY, sendCommentOnClick, likes = 0) {
        super(socialMediaScreen, x, y, pfp, username, caption, picture, width, 'messageIconFilled', likes)

        this.zoneBottomY = zoneBottomY
        this.sendCommentOnClick = sendCommentOnClick

        this.init()
    }

    init() {
        super.init()

        let bounds = this.getBounds()

        const ZONE_OFFSET_Y = 25
        const ZONE_Y = this.messageContainer.y + this.messageContainer.height + ZONE_OFFSET_Y
        const ZONE_HEIGHT = this.zoneBottomY - (ZONE_Y + this.y)
        
        this.createZone(this.textHeader.profilePicture.x, ZONE_Y, bounds.width, ZONE_HEIGHT, this.sendCommentOnClick)

        const COMMENTARIES_OFFSET_Y = 15
        const COMMENTARIES_Y = this.sendComment.y + this.sendComment.displayHeight + COMMENTARIES_OFFSET_Y
        const COMMENTARIES_HEIGHT = this.zoneBottomY - (COMMENTARIES_Y + this.y)

        this.listView = this.createCommentariesSection(this.sendComment.x, COMMENTARIES_Y, 
            bounds.width, COMMENTARIES_HEIGHT)
    }

    createZone(x, y, width, height, sendCommentOnClick) {
        const ZONE_ARC = 25

        const SEND_OFFSET_Y = 25

        let zone = this.scene.add.graphics();

        zone.fillStyle(this.scene.colors.blue0.hex.get0x, 1)
        zone.fillRoundedRect(x, y, width, height, { tl: ZONE_ARC, tr: ZONE_ARC, bl: 0, br: 0 });
        this.add(zone)

        let sendComment = this.scene.add.image(x + width / 2, y + SEND_OFFSET_Y, 'sendComment')
        sendComment.setScale(0.95)
        sendComment.setOrigin(0.5, 0)
        this.add(sendComment)
        
        this.scene.turnIntoButtonInteractionAnim(sendComment, sendComment, sendCommentOnClick)

        let style = { ...this.scene.style }
        style.fontSize = '27px'
        let sendCommentBottomY = sendComment.y + sendComment.displayHeight
        let noCommentsY = sendCommentBottomY + (height - SEND_OFFSET_Y - sendComment.displayHeight) / 2

        let translate = this.scene.translate("noCommentsText")
        let noComments = this.scene.add.text(x + width / 2, noCommentsY, translate, style);
        noComments.setOrigin(0.5, 0.5)
        this.add(noComments)

        // Propiedades
        this.sendComment = sendComment
        this.noComments = noComments
    }

    restartSendCommentAnim() {
        this.sendComment.restartInteractionAnim()
    }

    createCommentariesSection(x, y, width, height) {
        const PADDING = 10
        const END_PADDING = 15

        let listView = new VerticalListView(this.scene, x, y,
            1, PADDING, { width: width, height: height }, null, false, END_PADDING);
        this.add(listView)

        listView.init()

        return listView
    }

    addCommentary(pfp, username, commentary) {
        const COMMENTARY_SCALE = 0.85

        this.noComments.setVisible(false)

        let commentaryObject = this.addTextHeader(this.socialMediaScreen, this.params.width, pfp, 
            username, commentary, COMMENTARY_SCALE)
        this.listView.addLastItem(commentaryObject)
        super.addCommentary()
    }

    addHit(animTarget, onClick) {
        this.scene.turnIntoButtonSizeAnim(animTarget, animTarget, onClick)
    }
}