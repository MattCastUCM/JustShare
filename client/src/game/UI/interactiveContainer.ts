import { Scene, Geom } from "phaser";
import AnimatedContainer from "./animatedContainer";
import { DEBUG } from "../../types/misc";
import { setInteractive } from "../utils/misc";

export default class InteractiveContainer extends AnimatedContainer {
    /**
    * Clase base para los contenedores interactuables, con metodos para calcular su rectangulo de colision
    * @extends AnimatedContainer
    * @param {Scene} scene - escena a la que pertenece
    * @param {number} x - posicion x (opcional)
    * @param {number} y - posicion y (opcional)
    */
    public constructor(scene: Scene, x: number = 0, y: number = 0) {
        super(scene, x, y);
    }

    /**
    * Activa o desactiva los objetos indicados
    * @param {boolean} active - si se va a activar el objeto
    * @param {Function} onComplete - funcion a la que llamar cuando acaba la animacion (opcional)
    * @param {number} delay - tiempo en ms que tarda en llamarse a onComplete (opcional)
    */
    public activate(active: boolean, onComplete: Function = () => { }, delay: number = 0) {
        // Si se va a desactivar, se desactiva la interaccion inmediatamente para 
        // que no se pueda seguir interactuando mientras se reproduce la animacion
        if (!active) {
            this.disableInteractive();
        }

        super.activate(active, onComplete, delay);

        // Si se va a activar, se activa la interaccion una vez termina la animacion 
        // para que no se pueda interactuar mientras se esta reproduciendo
        if (active) {
            this.fadeAnim.on("complete", () => {
                this.setInteractive();
            });
        }
    }


    /**
    * Obtiene las dimensiones del rectangulo del container para hacerlo interactivo
    * @param {String} objectName - nombre del objeto a imprimir en el debug (opcional)
    */
    public calculateRectangleSize(objectName = "") {
        // Si no se elimina y se vuelve a llamar este metodo, la nueva zona no se calcula bien
        this.removeInteractive();

        // Esta en coordenadas globlaes
        let dims = this.getBounds();
        this.setSize(dims.width, dims.height);

        let rectangle = new Geom.Rectangle(dims.x + dims.width / 2 - this.x, dims.y + dims.height / 2 - this.y, dims.width, dims.height);

        setInteractive(this, {
            hitArea: rectangle,
            hitAreaCallback: Geom.Rectangle.Contains
        })

        if (DEBUG) {
            this.on("pointerdown", () => {
                console.log("clicking", objectName);
            });
        }
        this.disableInteractive();
    }
}