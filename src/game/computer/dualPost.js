import SelectedPost from "./selectedPost.js"
import FeedPost from "./feedPost.js"

export default class DualPost {
    constructor(socialMediaScreen, x, y, pfp, username, caption, picture, width, zoneBottomY) {
        this.socialMediaScreen = socialMediaScreen
        this.scene = socialMediaScreen.scene

        this.currNode = null

        let likes = this.scene.getRandomInt(0, 10)

        this.selected = new SelectedPost(socialMediaScreen, x, y, pfp, username, caption, picture, width, zoneBottomY,
            () => {
                // Si es un mensaje de chat, lo procesa
                if (this.currNode.type === "commentary") {
                    this.processNode();
                }
                // Si no, lo procesa el dialogManager
                else {
                    this.scene.dialogManager.setNode(this.currNode, []);
                    this.currNode = null
                }
            }, likes)
        this.feed = new FeedPost(socialMediaScreen, pfp, username, caption, picture, width, likes)

        this.selected.setMessageIconOnClick(() => {
            // TRACKER EVENT
            // console.log("Salir de una publicacion");
            this.scene.gameManager.sendItemInteraction("commentButton", { "Closing": true });

            this.showSelectedPost(false)
        })
        this.selected.setHeartIconOnClick(() => {
            this.toggleLike();
        })

        this.feed.setMessageIconOnClick(() => {
            // TRACKER EVENT
            // console.log("Entrar a una publicacion");
            this.scene.gameManager.sendItemInteraction("commentButton", { "Closing": false });

            this.showSelectedPost(true)
        })
        this.feed.setHeartIconOnClick(() => {
            this.toggleLike();
        })

        this.selected.setVisible(false)
    }


    toggleLike() {
        this.selected.toggleLike();

        this.feed.heartContainer.icon.setTexture(this.selected.heartContainer.icon.texture.key);
        this.feed.heartContainer.numberText.setNumber(this.selected.likes)

        if (this.selected.heartContainer.icon.texture.key === "heartIconFilled") {
            // TRACKER EVENT
            // console.log("Dar like");
            this.scene.gameManager.sendItemInteraction("likeButton", { "Liked": true });
        }
        else {
            // TRACKER EVENT
            // console.log("Quitar like");
            this.scene.gameManager.sendItemInteraction("likeButton", { "Liked": false });
        }
    }


    showSelectedPost(enable) {
        this.socialMediaScreen.setFeedVisible(!enable)
        this.selected.setVisible(enable)
    }

    setSelectedPostVisible(enable) {
        this.selected.setVisible(enable)
    }

    addCommentary(pfp, username, commentary) {
        this.selected.addCommentary(pfp, username, commentary)
        this.feed.addCommentary()
    }

    falsifyCommentaries(nCommentaries) {
        for (let i = 0; i < nCommentaries; ++i) {
            this.feed.addCommentary()
        }
    }

    setCommentaryNode(node) {
        this.currNode = node
        this.processNode()
    }

    processNode() {
        if (this.currNode) {
            let delay = 0;
            if (this.currNode.nextDelay == null) {
                delay = this.currNode.nextDelay;
            }

            if (this.currNode.type === "commentary") {
                setTimeout(() => {
                    this.addCommentary(this.currNode.pfp, this.currNode.name, this.currNode.text);
                    this.currNode = this.currNode.next[0];
                    this.processNextNode(delay);
                }, this.currNode.replyDelay);

            }
            // Si el nodo es de tipo condicion, hace que el dialogManager lo procese y obtiene el siguiente nodo
            else if (this.currNode.type === "condition") {
                let i = this.scene.dialogManager.processConditionNode(this.currNode);
                this.scene.dialogManager.currNode = this.currNode;

                // El indice del siguiente nodo sera el primero que cumpla una de las condiciones
                this.currNode = this.currNode.next[i];

                // Pasa al siguiente nodo
                this.processNextNode(delay);
            }
            // Si el nodo es de tipo evento, hace que el dialogManager lo procese y pasa al siguiente nodo
            else if (this.currNode.type === "event") {
                this.scene.dialogManager.processEventNode(this.currNode);

                // IMPORTANTE: DESPUES DE UN NODO DE EVENTO SOLO HAY UN NODO, POR LO QUE 
                // EL SIGUIENTE NODO SERA EL PRIMER NODO DEL ARRAY DE NODOS SIGUIENTES
                this.currNode = this.currNode.next[0];
                this.processNextNode(delay);
            }
            else if (this.currNode.type === "text") {
                this.scene.dialogManager.currNode = this.currNode;
                this.selected.restartSendCommentAnim()
                this.scene.dialogManager.disableInteraction();
            }
            else {
                this.selected.restartSendCommentAnim()
                this.scene.dialogManager.disableInteraction();
            }
        }
        else {
            this.scene.dialogManager.disableInteraction();
        }
    }

    processNextNode(delay) {
        setTimeout(() => {
            this.processNode();
        }, delay);
    }
}