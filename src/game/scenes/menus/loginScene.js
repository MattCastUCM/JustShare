
import ComputerBaseScene from '../../computer/computerBaseScene';
import RadioButtonGroup from '../../UI/radioButtonGroup';
import CheckBox from '../../UI/checkbox';
import { createRectTexture, TEXT_CONFIG } from '../../utils/graphics';

export default class LoginScene extends ComputerBaseScene {
    constructor() {
        super("LoginScene")
    }

    create(params) {
        super.create(params);

        this.createBackground('loginScreen')
        this.setNamespace('menus/loginScene')

        this.createPowerIcon(() => {
            this.sceneManager.changeScene("TitleScene");
        })

        const X = this.CANVAS_WIDTH / 3;
        const Y = 2.55 * this.CANVAS_HEIGHT / 7;
        const SCALE = 0.8

        const OFFSET_X = 70;
        const OFFSET_Y = 30;

        let container = this.add.container(X, Y);

        const nameInputSprite = "nameInput"
        createRectTexture(this, nameInputSprite, 335, 90, 0xffffff, 1, 2.5, 0x000000, 1, 20)

        const nameInputStyle = { ...TEXT_CONFIG };
        nameInputStyle.fontFamily = this.fontFamilies.normal;
        nameInputStyle.fontSize = '42px';
        nameInputStyle.color = '#000000';

        let nameContainer = this.createTextInputWithSideText(0, 0, nameInputSprite, "nameInput", nameInputStyle);
        container.add(nameContainer);

        const tickStyle = { ...TEXT_CONFIG };
        tickStyle.fontSize = '23px';
        tickStyle.fontStyle = 'bold';
        tickStyle.color = this.style.color;

        const checkBoxSprite = "checkBox"
        createRectTexture(this, checkBoxSprite, 30, 30, 0xffffff, 1, 2.5, 0x000000, 1, 10)

        const genderBoxSprite = "genderBox"
        createRectTexture(this, genderBoxSprite, 100, 100, 0xffffff, 1, 5, 0x000000, 1, 10)

        let genderContainer = this.createGenderOptions(OFFSET_X, nameContainer.height + OFFSET_Y, checkBoxSprite, genderBoxSprite, "genderBoxes", "invalidGender", tickStyle, true);
        container.add(genderContainer);

        let sexualityContainer = this.createGenderOptions(OFFSET_X, genderContainer.y + genderContainer.height + OFFSET_Y, checkBoxSprite, genderBoxSprite, "sexualityBoxes", "invalidSexuality", tickStyle, false);
        container.add(sexualityContainer);

        const acceptButtonSprite = "acceptButton"
        createRectTexture(this, acceptButtonSprite, 276, 84, 0xffffff, 1, 2.5, 0x000000, 1, 14)

        const acceptButtonStyle = { ...TEXT_CONFIG };
        acceptButtonStyle.fontFamily = this.fontFamilies.normal;
        acceptButtonStyle.fontSize = '43px';
        acceptButtonStyle.fontStyle = 'bold';
        acceptButtonStyle.color = this.colors.white.hex.getNumberSign;

        const acceptButton = this.createButton(0, sexualityContainer.y + sexualityContainer.height + OFFSET_Y * 1.5, acceptButtonSprite, 'acceptButton', () => {
            // TRACKER EVENT
            // this.gameManager.sendItemInteraction("loginButton");
            this.trackerManager.sendItemInteraction("loginButton");

            let errors = this.checkErrors(nameContainer, genderContainer, sexualityContainer);
            if (!errors) {
                this.startGame(nameContainer, genderContainer, sexualityContainer)
            }
        }, acceptButtonStyle);
        container.add(acceptButton);

        container.setScale(SCALE);
    }

    startGame(nameContainer, genderContainer, sexualityContainer) {
        const gender = genderContainer.group.getIndexSelButton() === 0 ? "male" : "female";

        const likesMen = sexualityContainer.manBox.checkBox.checked;
        const likesWomen = sexualityContainer.womanBox.checkBox.checked;

        let sexuality = "heterosexual";
        let harasserGender = "female"

        if (likesMen && likesWomen) {
            sexuality = "bisexual";
            harasserGender = this.getRandomInt(0, 1) === 0 ? "male" : "female";
        }
        else if (likesMen) {
            harasserGender = "male";
            if (gender === "male") {
                sexuality = "homosexual";
            }
        }
        else if (likesWomen && gender === "female") {
            sexuality = "homosexual";
        }

        const userInfo = {
            name: nameContainer.textInput.getText(),
            player: gender,
            harasser: harasserGender,
            sexuality: sexuality
        }
        this.gameManager.startGame(userInfo);
        this.translatorManager.setGenderContext("player", gender);
        this.translatorManager.setGenderContext("harasser", harasserGender)
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

    createTextInputWithSideText(x, y, sprite, transId, style) {
        const ERROR_OFFSET_X = 30;

        let container = super.createTextInputWithSideText(x, y, sprite, transId, style)

        // Texto de error a la derecha
        let errorText = this.addErrorText(container, container.x + container.width + ERROR_OFFSET_X)

        // Propiedaes
        container.errorText = errorText

        return container
    }

    createGenderOptions(x, y, checkBoxSprite, genderBoxSprite, transId, errorTransId, tickStyle, isRadioGroup) {
        const TEXT_OFFSET_X = -80;
        const CHECKBOX_OFFSET_X = 30
        const ERROR_OFFSET_X = 15;

        let container = this.add.container(x, y);

        // Texto a la izquierda
        this.addSideText(container, TEXT_OFFSET_X, transId)

        // Cajas genero
        let manBox = this.createGenderCheckbox(0, 0, checkBoxSprite, 'manIcon', genderBoxSprite, tickStyle);
        container.add(manBox);
        let womanBox = this.createGenderCheckbox(manBox.x + manBox.width + CHECKBOX_OFFSET_X, 0, checkBoxSprite, 'womanIcon', genderBoxSprite, tickStyle);
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

    createGenderIcon(x, y, genderSprite, genderBoxSprite) {
        const ICON_SCALE_PADDING = 20;

        let container = this.add.container(x, y)

        let edge = this.add.image(0, 0, genderBoxSprite);
        container.add(edge);

        let icon = this.add.image(0, 0, genderSprite);
        let iconScale = (edge.width - ICON_SCALE_PADDING * 2) / icon.width
        icon.setScale(iconScale);
        container.add(icon);

        const dims = container.getBounds();
        container.setSize(dims.width, dims.height);

        return container
    }

    createGenderCheckbox(x, y, checkboxSprite, genderSprite, genderBoxSprite, tickStyle) {
        // Contenedor principal
        let container = this.add.container(x, y);

        const PARAMS = {
            offsetX: -50,
            offsetY: -50,
        }

        let iconContainer = this.createGenderIcon(0, 0, genderSprite, genderBoxSprite)
        container.add(iconContainer)

        let checkBox = new CheckBox(this, PARAMS.offsetX, PARAMS.offsetY, this.colors.blue0.rgb, checkboxSprite, tickStyle)
        checkBox.addHitArea(iconContainer)

        container.add(checkBox);

        // Propiedades
        container.checkBox = checkBox
        container.setSize(iconContainer.width, iconContainer.height)

        return container
    }
}