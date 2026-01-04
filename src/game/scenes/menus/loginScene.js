
import ComputerBaseScene from '../../computer/computerBaseScene.js';
import RadioButtonGroup from '../../UI/radioButtonGroup.js'
import CheckBox from '../../UI/checkbox.js'

export default class LoginScene extends ComputerBaseScene {
    constructor() {
        super("LoginScene")
    }

    create(params) {
        super.create(params);

        this.createBackground('loginScreen')
        this.setNamespace('menus/loginScene')

        this.createPowerIcon(() => {
            this.gameManager.changeScene("TitleScene");
        })

        const X = this.CANVAS_WIDTH / 3;
        const Y = 2.55 * this.CANVAS_HEIGHT / 7;
        const SCALE = 0.8

        const OFFSET_X = 70;
        const OFFSET_Y = 30;

        let container = this.add.container(X, Y);

        let nameContainer = this.createTextInputWithSideText(0, 0, "nameInput");
        container.add(nameContainer);

        let genderContainer = this.createGenderOptions(OFFSET_X, nameContainer.height + OFFSET_Y,
            "genderBoxes", "invalidGender", true);
        container.add(genderContainer);

        let sexualityContainer = this.createGenderOptions(OFFSET_X, genderContainer.y + genderContainer.height + OFFSET_Y,
            "sexualityBoxes", "invalidSexuality", false);
        container.add(sexualityContainer);

        let acceptButton = this.createButton(0, sexualityContainer.y + sexualityContainer.height + OFFSET_Y * 1.5, 'acceptButton', () => {
            // TRACKER EVENT
            // console.log("Boton de login");
            this.gameManager.sendItemInteraction("loginButton");

            let errors = this.checkErrors(nameContainer, genderContainer, sexualityContainer);
            if (!errors) {
                this.startGame(nameContainer, genderContainer, sexualityContainer)
            }
        }, 0.8);
        container.add(acceptButton);

        container.setScale(SCALE);
    }

    startGame(nameContainer, genderContainer, sexualityContainer) {
        let gender = genderContainer.group.getIndexSelButton() === 0 ? "male" : "female";
        let sexuality = "heterosexual";
        let harasserGender = "female"

        if (sexualityContainer.manBox.checkBox.checked && sexualityContainer.womanBox.checkBox.checked) {
            sexuality = "bisexual";
            harasserGender = this.getRandomInt(0, 1) === 0 ? "male" : "female"
        }
        else if (sexualityContainer.manBox.checkBox.checked) {
            if (gender === "male") {
                sexuality = "homosexual";
            }

            harasserGender = "male"
        }
        else if (sexualityContainer.womanBox.checkBox.checked && gender === "female") {
            sexuality = "homosexual"
        }

        let userInfo = {
            name: nameContainer.textInput.getText(),
            gender: gender,
            sexuality: sexuality,
            harasser: harasserGender
        }
        this.gameManager.startGame(userInfo);
    }

    checkErrors(nameContainer, genderContainer, sexualityContainer) {
        const FADE_DURATION = 20;
        const MAX_N_CHARACTERES = 10;

        let errors = false;

        if (!nameContainer.textInput.isValid()) {
            this.changeText(nameContainer.errorText, FADE_DURATION, "invalidName");
            errors = true;
        }
        else if (nameContainer.textInput.getText().length > MAX_N_CHARACTERES) {
            this.changeText(nameContainer.errorText, FADE_DURATION, "shorterName", { number: MAX_N_CHARACTERES });
            errors = true;
        }
        else {
            this.makeTextDisappear(nameContainer.errorText, FADE_DURATION);
        }

        if (genderContainer.group.getIndexSelButton() === -1) {
            this.makeTextAppear(genderContainer.errorText, FADE_DURATION);
            errors = true;
        }
        else {
            this.makeTextDisappear(genderContainer.errorText, FADE_DURATION);
        }

        if (!sexualityContainer.manBox.checkBox.checked && !sexualityContainer.womanBox.checkBox.checked) {
            this.makeTextAppear(sexualityContainer.errorText, FADE_DURATION);
            errors = true;
        }
        else {
            this.makeTextDisappear(sexualityContainer.errorText, FADE_DURATION);
        }

        return errors;
    }

    addErrorText(container, x, transId) {
        let style = { ...this.style };
        style.fontSize = '30px';
        style.color = '#ff0000';

        let translation = " "
        if (transId) {
            translation = this.translate(transId)
        }

        let errorText = this.add.text(x, 0, translation, style);
        errorText.setOrigin(0, 0.5);
        errorText.alpha = 0;

        container.add(errorText);

        return errorText
    }

    createTextInputWithSideText(x, y, transId) {
        const ERROR_OFFSET_X = 30;

        let container = super.createTextInputWithSideText(x, y, transId, 1)

        // Texto de error a la derecha
        let errorText = this.addErrorText(container, container.x + container.width + ERROR_OFFSET_X)

        // Propiedaes
        container.errorText = errorText

        return container
    }

    createGenderOptions(x, y, transId, errorTransId, isRadioGroup = true) {
        const TEXT_OFFSET_X = -80;
        const CHECKBOX_OFFSET_X = 30
        const ERROR_OFFSET_X = 15;

        let container = this.add.container(x, y);

        // Texto a la izquierda
        this.addSideText(container, TEXT_OFFSET_X, transId)

        // Cajas genero
        let manBox = this.createGenderCheckbox(0, 0, 'manIcon');
        container.add(manBox);
        let womanBox = this.createGenderCheckbox(manBox.x + manBox.width + CHECKBOX_OFFSET_X, 0, 'womanIcon');
        container.add(womanBox);

        // Texto de error a la derecha
        let errorText = this.addErrorText(container, womanBox.x + womanBox.width / 2 + ERROR_OFFSET_X, errorTransId)

        // Propiedades
        container.setSize(manBox.width + CHECKBOX_OFFSET_X + womanBox.width, manBox.height)
        container.errorText = errorText
        container.manBox = manBox
        container.womanBox = womanBox

        if (isRadioGroup) {
            let checkBoxes = [];
            checkBoxes.push(manBox.checkBox);
            checkBoxes.push(womanBox.checkBox);
            let group = new RadioButtonGroup(checkBoxes);

            // Propiedades
            container.group = group
        }

        return container
    }

    // createGenderIcon(x, y, sprite, areaParams) {
    //     const ICON_SCALE_PADDING = 20;
    //     const FIGURE = this.gameManager.roundedSquare

    //     let container = this.add.container(x, y)

    //     let edge = this.add.image(0, 0, FIGURE.edge.name);
    //     container.add(edge);

    //     let icon = this.add.image(0, 0, sprite);
    //     let iconScale = (edge.width - ICON_SCALE_PADDING * 2) / icon.width
    //     icon.setScale(iconScale);
    //     container.add(icon);

    //     // Hay que modificar el area de colision de la checkbox para que sea los iconos
    //     let w = FIGURE.width / areaParams.scale - FIGURE.offset / areaParams.scale;
    //     let h = FIGURE.height / areaParams.scale - FIGURE.offset / areaParams.scale;
    //     let rectangle = new Phaser.Geom.Rectangle(0, 0, w, h);
    //     // Inicialmente el centro del checkbox y del icono coinciden
    //     // Entonces, sabiendo eso, se coloca el centro del area de colision en esa posicion y luego, se mueve respecto a como
    //     // este la checkbox desplazada de su centro
    //     rectangle.centerX = FIGURE.width / 2 + FIGURE.offset - areaParams.offsetX / areaParams.scale;
    //     rectangle.centerY = FIGURE.height / 2 + FIGURE.offset - areaParams.offsetY / areaParams.scale;

    //     return [container, rectangle, FIGURE]
    // }

    createGenderIcon(x, y, sprite) {
        const ICON_SCALE_PADDING = 20;
        const FIGURE = this.gameManager.roundedSquare

        let container = this.add.container(x, y)

        let edge = this.add.image(0, 0, FIGURE.edge.name);
        container.add(edge);

        let icon = this.add.image(0, 0, sprite);
        let iconScale = (edge.width - ICON_SCALE_PADDING * 2) / icon.width
        icon.setScale(iconScale);
        container.add(icon);
        container.setSize(FIGURE.width, FIGURE.height)

        return container
    }

    createGenderCheckbox(x, y, sprite) {
        // Contenedor principal
        let container = this.add.container(x, y);

        const FIGURE = this.gameManager.widerRoundedSquare
        let params = {
            offsetX: -50,
            offsetY: -50,
            scale: 0.3
        }

        // let [iconContainer, rectangle, iconFigure] = this.createGenderIcon(0, 0, sprite, params)
        let iconContainer = this.createGenderIcon(0, 0, sprite, params)
        container.add(iconContainer)

        let checkBox = new CheckBox(this, params.offsetX, params.offsetY, params.scale, this.style.color,
            this.colors.blue0.rgb, FIGURE.fill.name, FIGURE.edge.name)
        checkBox.addHitArea(iconContainer)

        container.add(checkBox);

        // Propiedades
        container.checkBox = checkBox
        container.setSize(iconContainer.width, iconContainer.height)

        return container
    }
}