export default class TextHeader extends Phaser.GameObjects.Container {
    constructor(socialMediaScreen, width, pfp, username, caption, scale = 1) {
        super(socialMediaScreen.scene, 0, 0)

        this.scene.add.existing(this)

        this.socialMediaScreen = socialMediaScreen

        const NAME_OFFSET_X = 10
        const caption_OFFSET_Y = 10

        this.profilePicture = this.createProfilePicture(0, 0, pfp)
        
        this.name = this.createName(this.profilePicture.displayWidth + NAME_OFFSET_X, this.profilePicture.y, username, [0, 0.5]) 
        
        this.caption = this.createCaption(this.name.x, this.name.y + this.name.displayHeight / 2 + caption_OFFSET_Y, width, caption)

        this.setScale(scale)

        let bounds = this.getBounds()
        this.h = bounds.height

        // Centrar elmentos
        this.socialMediaScreen.alignContainerItems(this, 0, bounds.width / 2, 0, -this.name.displayHeight / 2)
    }

    createProfilePicture(x, y, pfp, origin = [0, 0]) {
        let profilePicture = this.scene.add.image(x, y, pfp)
        profilePicture.setOrigin(origin[0], origin[1])
        profilePicture.setScale(0.9)
        this.add(profilePicture)

        return profilePicture
    }

    createName(x, y, username, origin = [0, 0]) {
        let style = { ...this.scene.style }
        style.fontSize = '25px'

        let name = this.scene.add.text(x, y, username, style);
        name.setOrigin(origin[0], origin[1]);
        this.add(name)

        return name
    }

    createCaption(x, y, width, caption) {
        let container = this.scene.add.container(x, y)

        let style = { ...this.scene.style }
        style.fontSize = '23px';
        style.wordWrap = {
            width: width,
            useAdvancedWrap: true 
        }

        let text = this.scene.add.text(0, 0, caption, style);
        text.setOrigin(0, 0);
        container.add(text)

        let rect = this.scene.add.zone(text.x, text.y, width, text.displayHeight);
        rect.setOrigin(text.originX, text.originY);
        container.add(rect)

        container.bringToTop(text)

        let debug = this.scene.sys.game.debug;
        if(debug.enable) {
            let debugRect = this.scene.add.rectangle(rect.x, rect.y, rect.width, rect.height, debug.color);
            debugRect.alpha = 0.5
            debugRect.setOrigin(rect.originX, rect.originY);
            container.add(debugRect)
        }

        this.add(container)

        // Propiedades
        container.setSize(rect.width, rect.height)

        return container
    }
}