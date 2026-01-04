import Post from "./post.js";
import ListViewHit from "../UI/listView/listViewHit.js";

export default class FeedPost extends Post {
    constructor(socialMediaScreen, pfp, username, caption, picture, width, likes = 0) {
        super(socialMediaScreen, 0, 0, pfp, username, caption, picture, width, 'messageIcon', likes)

        this.hits = []

        this.init()
    }

    init() {
        super.init()
        
        const LINE_OFFSET_Y = 20
        const LINE_Y = this.messageContainer.y + this.messageContainer.height + LINE_OFFSET_Y
        
        const LINE_MARGIN = 10
        
        const LINE_WIDTH = 1.5

        this.createLine(0, LINE_Y, this.params.width + LINE_MARGIN, LINE_Y, LINE_WIDTH, [0.5, 0.5])

        // Propiedades
        let bounds = this.getBounds()
        this.h = bounds.height
    }

    createLine(x1, y1, x2, y2, width, origin = [0, 0]) {

        let line = this.scene.add.line(0, 0, x1, y1, x2, y2, this.scene.colors.black.hex.get0x);
        line.setOrigin(origin[0], origin[1])
        line.setLineWidth(width)
        this.add(line)
    }

    addHit(animTarget, onClick) {
        let hit = new ListViewHit(this.scene, animTarget)
        this.hits.push(hit)
        this.scene.turnIntoButtonSizeAnim(animTarget, hit, onClick)
    }
}