import { Scene } from "phaser";
import { Gender } from "../../types/user";
import { DEBUG, SUPPORTED_LNGS } from "../../types/config";
import i18next from "i18next";
import Backend from 'i18next-http-backend';

export default class TranslatorManager {
    private static instance: TranslatorManager;

    private genderMap: Map<string, string>;
    private defaultOptions: Record<string, any>

    public constructor() {
        this.genderMap = new Map();

        this.defaultOptions = {
            returnObjects: true
        }
    }

    public static getInstance() {
        TranslatorManager.instance = TranslatorManager.instance ?? new TranslatorManager();
        return TranslatorManager.instance;
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

    public loadDialogs(scene: Scene, dialogs: string[]) {
        // Archivos de dialogos (estructura)
        scene.load.setPath('localization/structure');

        dialogs.forEach(dialog => {
            // Quedarse con la ultima parte del path, que corresponde con el id del archivo
            const subPaths = dialog.split('/');
            const name = subPaths[subPaths.length - 1];
            // Ruta completa (dentro de la carpeta structure y con el extension .json)
            const path = dialog + ".json";
            scene.load.json(name, path);
        });
    }

    public async loadNamespaces(dialogs: string[], namespaces: string[]) {
        const result = dialogs.concat(namespaces);

        const languages = SUPPORTED_LNGS;

        console.log(languages)

        // Inicialmente solo se carga el idioma inicial y los de respaldo
        // Luego, conforme se usan tambien se cargan el resto
        await i18next
            .use(Backend)
            .init({
                // Idioma inicial
                lng: languages[0],
                // en caso de que no se encuentra una key en otro idioma se comprueba en los siguientes en orden
                fallbackLng: languages[0],
                // Idiomas permitidos
                supportedLngs: languages,
                // IMPORTANTE: hay que precargar los namespaces de todos los idiomas porque sino a la hora
                // de usar un namespace por primera vez no le da tiempo a encontrar la traduccion
                preload: languages,
                // Namespaces que se cargan para cada uno de los idiomas
                ns: result,
                // Mostrar informacion de ayuda por consola
                debug: true,
                // Cargar las traducciones de un servidor especificado en vez de ponerlas directamente
                backend: {
                    // La ruta desde donde cargamos las traducciones
                    // {{lng}} --> nombre carpeta de cada uno de los idiomas
                    // {{ns}} --> nombre carpeta de cada uno de los namespaces
                    loadPath: 'localization/{{lng}}/{{ns}}.json'
                }
            })
    }

    private processText(str: string) {
        // Si se ha obtenido algo
        if (str != null) {
            // Si el objeto obtenido no es un array, devuelve el texto con las expresiones <> reemplazadas
            if (!Array.isArray(str)) {
                if (this.hasTextProperty(str)) {
                    return this.replaceGender(str.text);
                }
                else if (typeof str === "string") {
                    return this.replaceGender(str);
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
                        str[i] = this.processText(str[i].text);
                    }
                    else {
                        str[i] = this.processText(str[i]);
                    }
                }
            }
        }
        return str;
    }

    /**
     * Obtiene el texto traducido
     * @param {string} translationId - id completa del nodo en el que mirar
     * @param {Record<string, any>} options - parametros que pasarle a i18n
     */
    public translate(translationId: string, namespace: string, options: Record<string, any> = {}): string | string[] {
        const resolvedOptions = {
            ...this.defaultOptions,
            ...options,
            ns: namespace
        };

        let str = i18next.t(translationId, resolvedOptions);

        return this.processText(str);
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

    public getCurrentLanguage() {
        return i18next.language;
    }
}