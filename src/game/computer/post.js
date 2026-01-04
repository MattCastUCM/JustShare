import TextHeader from "./textHeader.js";

export default class Post extends Phaser.GameObjects.Container {
    constructor(socialMediaScreen, x, y, pfp, username, caption, picture, width, messageIcon, likes = 0) {
        super(socialMediaScreen.scene, x, y)

        this.scene.add.existing(this)

        this.socialMediaScreen = socialMediaScreen

        this.params = {
            pfp: pfp,
            username: username,
            caption: caption,
            picture: picture,
            width: width
        }

        this.messageIcon = messageIcon
        this.nCommentaries = 0

        this.likes = likes
        this.heartChecked = false
    }

    init() {
        const ICON_OFFSET_X = 25
        const ICON_OFFSET_Y = 5

        this.textHeader = this.addTextHeader(this.socialMediaScreen, this.params.width, this.params.pfp,
            this.params.username, this.params.caption)
        this.add(this.textHeader)

        let lastItemX = this.textHeader.caption.x
        let lastItemY = this.textHeader.caption.y
        let lastItemHeight = this.textHeader.caption.height

        if (this.params.picture) {
            const PICTURE_RIGHT_PADDING = 60
            const PICTURE_OFFSET_Y = 10

            this.addToUpdateList();

            this.createPicture(lastItemX, lastItemY + lastItemHeight + PICTURE_OFFSET_Y, this.params.picture,
                this.params.width - PICTURE_RIGHT_PADDING)

            lastItemX = this.image.x
            lastItemY = this.image.y
            lastItemHeight = this.image.displayHeight
        }

        this.createMessageIcon(lastItemX, lastItemY + lastItemHeight + ICON_OFFSET_Y)

        this.createHeartIcon(this.messageContainer.x + this.messageContainer.width + ICON_OFFSET_X, this.messageContainer.y)
    }

    preUpdate(t, dt) {
        if (this.params.picture) {
            let matrix = this.image.getWorldTransformMatrix();

            this.imageBorder.clear()
            this.imageBorder.fillStyle(0x000000, 0);
            this.imageBorder.fillRoundedRect(matrix.tx, matrix.ty,
                this.image.width * matrix.scaleX, this.image.height * matrix.scaleY, 15)
        }
    }

    addTextHeader(socialMediaScreen, width, pfp, username, caption, scale = 1) {
        let textHeader = new TextHeader(socialMediaScreen, width, pfp, username, caption, scale)
        return textHeader
    }

    createPicture(x, y, imageId, width, origin = [0, 0]) {
        let image = this.scene.add.image(x, y, imageId)
        let scale = width / image.width
        image.setScale(scale)
        image.setOrigin(origin[0], origin[1])
        this.add(image)

        let border = this.scene.add.graphics();
        let geometryMask = border.createGeometryMask()
        image.setMask(geometryMask)

        // Propiedades
        this.image = image
        this.imageBorder = border
    }

    addHit(animTarget, onClick) {
        throw new Error('This method must be override!');
    }

    addTextNumber(container, x, y) {
        const LIMIT = 99

        let style = { ...this.scene.style }
        style.fontSize = '28px'

        let numberText = this.scene.add.text(x, y, '+' + LIMIT, style);
        numberText.setOrigin(0, 0.5)
        container.add(numberText)

        numberText.setNumber = function (number) {
            if (number > LIMIT) {
                this.setText('+' + LIMIT)
            }
            else {
                this.setText(number)
            }
        }

        return numberText
    }

    createIcon(x, y, iconImage) {
        const TEXT_OFFSET_X = 5

        let container = this.scene.add.container(x, y)

        let icon = this.scene.add.image(0, 0, iconImage)
        icon.setScale(0.15)
        icon.setOrigin(0.5, 0)
        icon.x += icon.displayWidth / 2
        container.add(icon)

        let numberText = this.addTextNumber(container, icon.x + icon.displayWidth / 2 + TEXT_OFFSET_X, icon.displayHeight / 2)

        this.add(container)

        // Propiedades
        let bounds = container.getBounds()
        container.setSize(bounds.width, bounds.height)
        container.icon = icon
        container.numberText = numberText

        // Se hace despues de setear las propiedades para calcular el espacio que hay que dejar
        // para como maximo escribir '+99'
        numberText.setNumber(0)

        return container
    }

    createMessageIcon(x, y) {
        this.messageContainer = this.createIcon(x, y, this.messageIcon)

        // Propiedades
        let bounds = this.messageContainer.getBounds()
        this.messageContainer.setSize(bounds.width, bounds.height)
    }

    setMessageIconOnClick(onClick) {
        this.addHit(this.messageContainer.icon, () => {
            if (onClick) onClick()
        })
    }

    addCommentary() {
        ++this.nCommentaries
        this.messageContainer.numberText.setNumber(this.nCommentaries)
    }

    toggleLike() {
        this.heartChecked = !this.heartChecked

        let texture = null
        if (this.heartChecked) {
            texture = 'heartIconFilled'
            this.likes += 1
        }
        else {
            texture = 'heartIcon'
            this.likes -= 1
        }
        this.heartContainer.icon.setTexture(texture)
        this.heartContainer.numberText.setNumber(this.likes)
    }

    createHeartIcon(x, y) {
        this.heartContainer = this.createIcon(x, y, 'heartIcon')
        this.heartContainer.numberText.setNumber(this.likes)
    }

    setHeartIconOnClick(onClick) {
        this.addHit(this.heartContainer.icon, () => {
            if (onClick) onClick()
        })
    }
}