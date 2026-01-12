import { Gender } from "../../types";
import { Singleton } from "../utils/singleton";
import i18next from "i18next";

export default class TranslatorManager extends Singleton {
    private genderMap: Map<string, string>;
    private defaultOptions: Record<string, any>

    public constructor() {
        super();

        this.genderMap = new Map();

        this.defaultOptions = {
            returnObjects: true
        }
    }

    public setDefaultOption(key: string, value: any) {
        this.defaultOptions[key] = value;
    }

    public setGenderContext(key: string, value: Gender) {
        this.genderMap.set(key, value);
    }

    private hasTextProperty(value: unknown): value is { text: string } {
        return (
            typeof value === 'object' &&
            value !== null &&
            'text' in value &&
            typeof (value as any).text === 'string'
        );
    }

    /**
     * Obtiene el texto traducido
     * @param {string} translationId - id completa del nodo en el que mirar
     * @param {Object} options - parametros que pasarle a i18n
     */
    public translate(translationId: string, namespace: string, options: Record<string, any> = {}) {
        const resolvedOptions = {
            ...this.defaultOptions,
            ...options,
            ns: namespace
        };

        let str = i18next.t(translationId, resolvedOptions);

        // Si se ha obtenido algo
        if (str != null) {
            // Si el objeto obtenido no es un array, devuelve el texto con las expresiones <> reemplazadas
            if (!Array.isArray(str)) {
                if (this.hasTextProperty(str)) {
                    return this.replaceGender(str.text);
                }
                else if (typeof str === "string") {
                    return this.replaceGender(str)
                }
            }
            // Si es un array
            else {
                // Recorre todos los elementos
                for (let i = 0; i < str.length; i++) {
                    // Si el elemento tiene la propiedad text, modifica el
                    // objeto original para reemplazar su contenido por el
                    // texto con las expresiones <> reemplazadas
                    if (str[i].text != null) {
                        str[i] = this.replaceGender(str[i].text);
                    }
                }
            }
        }
        return str;
    }

    /**
     * Reemplaza en el string indicado todos los contenidos que haya entre <>
     * con el formato: <player, male expression, female expression >, en el que 
     * la primera variable es el contexto a comprobar y las otras dos expresiones
     * son el texto por el que sustituir todo lo que hay entre <>
     * @param {string} input - texto en el que reemplazar las expresiones <>
     * @returns {string} - texto con las expresiones <> reemplazadas
     */
    private replaceGender(input: string) {
        // Expresion a sustituir (todo lo que haya entre <>)
        const regex = /<([^>]+)>/g;

        // Encuentra todos los elementos entre <>
        const matches = [...input.matchAll(regex)];

        let result = '';
        let lastEndIndex = 0;
        // Por cada <>
        matches.forEach((match, _) => {
            // Obtiene todo el contenido entre <> y lo separa en un array
            const [fullMatch, content] = match;
            const parts = content.split(", ");

            const key = parts[0];
            const maleText = parts[1];
            const femaleText = parts[2];

            const context = this.genderMap.get(key);

            // Elige el texto por el que reemplazar la expresion dependiendo del contexto
            let replacement = "";
            if (context === "male") {
                replacement = maleText;
            }
            else if (context === "female") {
                replacement = femaleText;
            }

            // Anade el texto reemplazado al texto completo
            result += input.slice(lastEndIndex, match.index) + replacement;

            // Actualiza el indice del ultimo <> para el siguiente <>
            lastEndIndex = match.index + fullMatch.length;
        });

        // Anade el resto del texto al texto completo
        result += input.slice(lastEndIndex);
        return result;
    }
}