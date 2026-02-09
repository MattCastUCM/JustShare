import { fadeAnimation } from "../utils/graphics";
import { Scene, GameObjects, Tweens } from "phaser";
import { hasTransform } from "../utils/guards";

export default class AnimatedContainer extends GameObjects.Container {
    /**
    * Clase que extiende Container para agregar animaciones al activar/desactivar la visibilidad
    * @extends GameObjects.Container
    * @param {Scene} scene - escena a la que pertenece
    * @param {number} x - posicion x (opcional)
    * @param {number} y - posicion y (opcional)
    */

    protected fadeAnim: Tweens.Tween

    constructor(scene: Scene, x = 0, y = 0) {
        super(scene, x, y);
        this.scene = scene;

        scene.add.existing(this);
    }

    /**
    * Para activar o desactiar los objetos con una animacion de opacidad
    * @param {boolean} active - si se va a activar el objeto
    * @param {Function} onComplete - funcion a la que llamar cuando acaba la animacion (opcional)
    * @param {number} delay - tiempo en ms que tarda en llamarse a onComplete (opcional)
    */
    public activate(active: boolean, duration: number = 150, onComplete: Function = () => { }, delay: number = 0) {
        this.fadeAnim = fadeAnimation(this, active, duration);

        // Al terminar la animacion, se ejecuta el onComplete si es una funcion valida
        this.fadeAnim.on("complete", () => {
            if (!active) {
                this.setVisible(false);
            }

            setTimeout(() => {
                onComplete();
            }, delay);
        });
    }

    /**
    * Devolver todos los hijos que hay en el container, incluyendo los hijos de cualquier container hijo
    * @returns {Array, Phaser.GameObject}
    */
    public getAllChildren() {
        let allChildren: GameObjects.GameObject[] = [];
        // Se usa una pila para procesar los container.
        // Se comienza con el container actual
        let containerStack: GameObjects.Container[] = [this];

        while (containerStack.length > 0) {
            // Se extrae el container mas reciente para procesar sus hijos
            let container = containerStack.pop();
            if (container) {
                container.list.forEach(child => {
                    // Si el hijo es un container, se mete en la pila
                    if (child instanceof Phaser.GameObjects.Container) {
                        containerStack.push(child);
                    }
                    else {
                        // Si no, se anade a la lista de hijos
                        allChildren.push(child);
                    }
                })
            }
        }

        return allChildren;
    }

    /**
     * Convertir un punto de coordenadas globales (mundo) a coordenadas locales del container
     * @param {number} worldX - posicion x en el espacio global
     * @param {number} worldY - posicion y en el espacio global
     * @returns {{x: number, y: number}} - posiciones x, y en el espacio local
     */
    worldToLocal(worldX: number, worldY: number) {
        // Se obtiene la matriz de transformaciones global (mundo) del container
        let matrix = this.getWorldTransformMatrix();

        // La matriz de mundo convierte local -> global,
        // asi que su inversa global -> local
        let localPoint = matrix.applyInverse(worldX, worldY);
        return localPoint;
    }

    /**
    * Establecer el origen del container.
    * Es decir, se reposicionan todos los elementos para que un punto especifico del bounding box
    * quede en el origen (0,0) del espacio local del container
    * @param {number} originX - origen en x [0, 1] (opcional)
    * @param {number} originY - origen en y [0, 1] (opcional)
    */
    setContainerOrigin(originX: number = 0.5, originY: number = originX) {
        // Se obtiene la bounding box, que esta en coordenadas globales
        let bounds = this.getBounds();

        // Se convierte la esquina superior izquierda a coordenadas locales
        let topLeft = this.worldToLocal(bounds.x, bounds.y);
        let width = bounds.width;
        let height = bounds.height;

        // Se calcula el offset, que depende del origen definido
        let offsetX = topLeft.x + width * originX;
        let offsetY = topLeft.y + height * originY;

        // Se aplica el offset a todos los hijos para ajustar su posicion relativa
        this.list.forEach(child => {
            if (hasTransform(child)) {
                child.x -= offsetX;
                child.y -= offsetY;
            }
        });
    }
}