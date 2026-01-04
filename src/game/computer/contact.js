import ListViewHit from "../UI/listView/listViewHit.js"

export default class Contact extends Phaser.GameObjects.Container {
    constructor(socialMediaScreen, pfp, username, width, height, onClick) {
        super(socialMediaScreen.scene, 0, 0)

        this.socialMediaScreen = socialMediaScreen

        this.hits = []

        this.nNotifications = 0

        let bg = this.createBackground(0, 0, width, height, onClick, [0.5, 0])

        const PROFILE_OFFSET_X = 20

        let profile = this.socialMediaScreen.createImageWithSideText(-width / 2 + PROFILE_OFFSET_X, bg.displayHeight / 2, pfp, username, height / 100, [0, 0.5])
        this.add(profile)

        const NOTIFICATION_OFFSET = 10

        this.notificationsContainer = this.createNotificationIcon(profile.x + profile.width + NOTIFICATION_OFFSET, profile.y)

        this.h = bg.displayHeight
    }

    createNotificationIcon(x, y) {
        const RADIUS = 17
        const BORDER_WIDTH = 1
        const LIMIT = 99

        let container = this.scene.add.container(x, y)

        let icon = this.scene.add.circle(0, 0, RADIUS, this.scene.colors.orange.hex.get0x);
        icon.setStrokeStyle(BORDER_WIDTH, this.scene.colors.black.hex.get0x);
        icon.setOrigin(0.5, 0.5)
        container.add(icon)

        // Configuracion de texto para las notificaciones
        let style = { ...this.scene.style }
        style.fontSize = '20px'
        style.color = this.scene.colors.white.hex.get0x

        let numberText = this.scene.add.text(0, 0, '+' + LIMIT, style)
        numberText.setOrigin(0.5, 0.5);
        container.add(numberText)

        container.list.forEach((item) => {
            item.x += RADIUS
        });

        // Propiedades
        container.numberText = numberText

        // Gestion de las notificaciones
        container.nNotifications = 0
        container.generateNotifications = function () {
            if (this.nNotifications <= 0) {
                this.setVisible(false)

            }
            else {
                this.setVisible(true)

                if (this.nNotifications <= LIMIT) {
                    this.numberText.setText(this.nNotifications)
                }
                else {
                    this.numberText.setText('+' + LIMIT)
                }

            }
        }

        container.addNotification = function () {
            ++this.nNotifications
            this.generateNotifications()
        }
        container.clearNotifications = function () {
            this.nNotifications = 0
            this.generateNotifications()
        }

        container.clearNotifications()


        this.add(container)

        return container
    }

    addNotification() {
        this.notificationsContainer.addNotification()
    }

    clearNotifications() {
        this.notificationsContainer.clearNotifications()
    }

    createBackground(x, y, width, height, onClick, origin = [0, 0]) {
        const BORDER_WIDTH = 1

        let bg = this.scene.add.rectangle(x, y, width, height, this.scene.colors.white.hex.get0x);
        bg.setStrokeStyle(BORDER_WIDTH, this.scene.colors.black.hex.get0x);
        bg.setOrigin(origin[0], origin[1])
        this.add(bg)

        bg.setTint = function (color) {
            this.setFillStyle(color)
        }

        let hit = new ListViewHit(this.scene, bg)
        this.hits.push(hit)
        this.scene.turnIntoButtonColorAnim(bg, hit, onClick)

        return bg
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
}