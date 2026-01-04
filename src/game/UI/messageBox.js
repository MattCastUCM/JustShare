export default class MessageBox extends Phaser.GameObjects.Container {
    /**
     * Contenedor para las burbujas de mensajes
     * @extends Phaser.GameObjects.Container
     * @param {Phaser.Scene} scene - escena a la que pertenece (UIManager)
     * @param {String} text - texto a escribir en el mensaje
     * @param {String} character - personaje que escribe el mensaje
     * @param {Number} type - tipo de mensaje (0 = mensaje de chat, 1 = comentario de la red social)
     * @param {Number} maxWidth - anchura maxima que puede tener la burbuja de dialogo
     * 
     */
    constructor(scene, msgText, character, name, type, maxWidth) {
        super(scene, 0, 0);

        // Configuracion de margenes
        let BOX_PADDING = 50;
        let TEXT_PADDING = 20;

        // Configuracion de la burbuja de texto (por defecto, la del jugador)
        let img = "myBubble";
        let leftWidth = 25;
        let rightWidth = 53;
        let topHeight = 25;
        let bottomHeight = 44;
        let heightMultiplier = 3;
        let charName = "";

        // Configuracion de la burbuja de texto si es un mensaje de chat y el personaje 
        // que escribe no es el jugador O si es un comentario de la red social
        if ((character !== "player" && type === 0) || type === 1) {
            if (type === 0) {
                img = "othersBubble";
                leftWidth = 50;
                rightWidth = 65;
            }
            else {
                img = "commentBubble";
                leftWidth = 50;
                rightWidth = 65;
                bottomHeight = 36;
            }
            
            if (character != null && name != "") {
                heightMultiplier = 3.5;
            }
            charName = name;
        }
        
        // Configuracion de texto para la el texto del mensaje
        let textConfig = { ...scene.gameManager.textConfig };
        textConfig.fontFamily = 'roboto-regular';
        textConfig.fontStyle = 'bold';
        textConfig.fontSize = 18 + 'px';
        textConfig.color = '#000';
        textConfig.wordWrap = {
            width: maxWidth - (BOX_PADDING * 2 + TEXT_PADDING * 3),
            useAdvancedWrap: true
        }


        // id de la imagen (todo lo que haya entre [])
        let regex = /\[([^\]]+)\]/g;

        // Encuentra todos los elementos entre <>
        let matches = [...msgText.matchAll(regex)];
        let isPhoto = false;
        if (matches[0] != null && matches[0][1] != null) {
            msgText = ""
            isPhoto = true;
        }

        // Configuracion de texto para el nombre del contacto
        let nameTextConfig = { ...textConfig };
        nameTextConfig.color = '#5333bb';

        // Crea el texto y el nombre
        let text = this.scene.add.text(-5, - TEXT_PADDING * 0.25 + 5, msgText, textConfig).setOrigin(0, 0.5);
        let nameText = this.scene.add.text(-5, - TEXT_PADDING * 0.25, charName, nameTextConfig).setOrigin(0, 0.5);

        let box = null;
        let photo = null;

        // Crea la burbuja de texto como un nineslice
        if (isPhoto) {
            let IMG_SIZE = 300;
            let boxSize = IMG_SIZE + TEXT_PADDING;
            
            box = scene.add.nineslice(
                0, 0, img, "", boxSize, boxSize, leftWidth, rightWidth, topHeight, bottomHeight
            ).setOrigin(0.5, 0.5);

            photo = scene.add.image(text.x + leftWidth - TEXT_PADDING * 1.63, text.y + topHeight + TEXT_PADDING * 3.2, matches[0][1]).setOrigin(0.5, 0);
            photo.displayWidth = IMG_SIZE - TEXT_PADDING * 3;
            photo.displayHeight = IMG_SIZE - TEXT_PADDING * 3;
        }
        else {
            // Crea la imagen de la burbuja de texto para obtener su ancho y calcula el ancho que deberia tener la caja
            // (el ancho de lo que ocupe mas espacio entre el nombre, el texto, o la propia caja)
            let boxImg = scene.add.image(0, 0, img);
            let boxWidth = Math.max(text.displayWidth + TEXT_PADDING * 3, nameText.displayWidth + TEXT_PADDING * 3, boxImg.displayWidth)
            boxImg.destroy();

            box = scene.add.nineslice(
                0, 0, img, "", boxWidth, text.displayHeight + TEXT_PADDING * heightMultiplier, leftWidth, rightWidth, topHeight, bottomHeight
            ).setOrigin(0.5, 0.5);
        }
        

        // Mueve la burbuja a la izquierda o a la derecha dependiendo de quien es la burbuja de texto
        if (type === 0 && character === "player") {
            box.x = box.x + (maxWidth / 2) - (box.displayWidth / 2) - BOX_PADDING;
            text.x += box.x - box.displayWidth / 2 + TEXT_PADDING;
        }
        else {
            box.x = box.x - (maxWidth / 2) + (box.displayWidth / 2) + BOX_PADDING;
            text.x += box.x - box.displayWidth / 2 + TEXT_PADDING * 2.3;
        }

        if (character != null && name != "" && character != "player") {
            text.y += TEXT_PADDING / 2;

            if (photo != null) {
                photo.y += TEXT_PADDING / 2;
            }
        }

        // Mueve hacia abajo el mensaje (ya que posteriormente se anadira a una listView cuyos objetos
        // tienen que tener el origen en 0.5, 0 y el origen del no se puede cambiar)
        nameText.x = text.x;
        nameText.y = text.y + TEXT_PADDING * 3.4;
        box.y += box.displayHeight / 2 + BOX_PADDING;
        text.y += box.displayHeight / 2 + BOX_PADDING;

        this.add(text);
        this.add(nameText);
        this.add(box);
        this.bringToTop(text);
        this.bringToTop(nameText);

        if (photo != null) {
            this.add(photo);
            this.bringToTop(photo);
        }

        this.h = box.displayHeight + BOX_PADDING;

        scene.add.existing(this);
    }
}