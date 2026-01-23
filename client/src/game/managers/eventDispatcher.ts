import { Events } from "phaser";

type EventName = string;
type Owner = object;
type EventFn = (...args: any[]) => void;

export default class EventDispatcher {
    /**
    * Clase para tratar los mensajes sin tener en cuenta el ambito puesto que es un Singleton
    * De este modo cualquier objeto puede acceder a ella y emitir un mensaje y otro que se 
    * encuentre en otro lugar distinto puede suscribirse sin preocuparse del ambito
    */

    private static instance: EventDispatcher;

    private emitter: Events.EventEmitter;

    // EVENTOS TEMPORALES
    // evento -> propietarios
    private eventsMap: Map<EventName, Set<Owner>>;

    // propietario -> evento -> funciones
    private ownersMap: Map<Owner, Map<EventName, Set<EventFn>>>;

    // EVENTOS PERMANENTES
    private ownersPermanentMap: Map<Owner, Map<EventName, Set<EventFn>>>;

    public constructor() {
        // Emisor de eventos
        this.emitter = new Events.EventEmitter();

        this.eventsMap = new Map();
        this.ownersMap = new Map();
        this.ownersPermanentMap = new Map();
    }

    public static getInstance() {
        EventDispatcher.instance = EventDispatcher.instance ?? new EventDispatcher();
        return EventDispatcher.instance;
    }

    /**
    * Metodo para emitir un evento
    * @param {EventName} event - nombre del evento
    * @param {Owner} obj - objeto que reciben los objetos suscritos al evento (opcional)
    */
    public dispatch(event: EventName, obj: Owner) {
        this.emitter.emit(event, obj);
    }

    /**
     * Metodo para comprobar si un evento TEMPORAL o PERMANENTE ya existe
     * @param {EventName} event - nombre del evento 
     * @param {Owner} owner - objeto que se suscribe al evento
     * @param {EventFn} fn - funcion que se ejecuta al producirse el evento
     * @param {Map} ownersMap - mapa de propietarios en el que buscar el evento (TEMPORAL O PERMANENTE)
     */
    private alreadyExists(event: EventName, owner: Owner, fn: EventFn, ownersMap: Map<Owner, Map<EventName, Set<EventFn>>>) {
        // Existe el propietario...
        if (ownersMap.has(owner)) {
            // El propietario esta suscrito a ese evento...
            let ownerAux = ownersMap.get(owner);
            if (ownerAux && ownerAux.has(event)) {
                // El propietario tiene esa funcion suscrita a ese evento...
                let eventAux = ownerAux.get(event);
                if (eventAux && eventAux.has(fn)) {
                    // Entonces, ya existe esa suscripcion
                    return true;
                }
            }
        }
        return false;
    }


    /**
    * Metodo para suscribir un objeto a un evento TEMPORAL o PERMANENTE
    * @param {EventName} event - nombre del evento
    * @param {Owner} owner - objeto que se suscribe al evento (contexto/scope)
    * @param {EventFn} fn - funcion que se ejecuta cuando se produce el evento
    * @param {boolean} permanent - indica si la suscripcion es permanente (true) o temporal (false)
    */
    public add(event: EventName, owner: Owner, fn: EventFn, permanent: boolean) {
        let exists = false;

        // Si no existe como permanente...
        exists = this.alreadyExists(event, owner, fn, this.ownersPermanentMap);
        if (!exists) {
            // Se quiere anadir como permanente...
            if (permanent) {
                // Se anade como permanente
                // exists -> false
                this.addAsPermanent(event, owner, fn);

                // Si existia como temporal...
                if (this.alreadyExists(event, owner, fn, this.ownersMap)) {
                    // Se elimina porque ahora es permanente
                    this.deepRemove(event, owner, fn);
                }
            }
            // Se quiere anadir como temporal...
            else {
                // Si no existe como temporal...
                exists = this.alreadyExists(event, owner, fn, this.ownersMap);
                if (!exists) {
                    // Se anade como temporal
                    // exists -> false
                    this.addAsTemporary(event, owner, fn);
                }
            }
        }

        // Si no existe, se emite...
        if (!exists) {
            // Nota: aunque se ha tratado en la propia clase, EventEmitter hace que si ya se esta suscrito
            // al evento, no se vuelve a suscribir
            this.emitter.on(event, fn, owner);
        }
    }

    /**
     * Metodo para almacenar en los mapas un evento TEMPORAL
     * @param {EventName} event - nombre del evento 
     * @param {Owner} owner - objeto que se suscribe al evento
     * @param {EventFn} fn - funcion que se ejecuta al producirse el evento
     */
    private addAsTemporary(event: EventName, owner: Owner, fn: EventFn) {
        // EVENTOS
        if (!this.eventsMap.has(event)) {
            // El evento no existe...
            // Se crea el evento en el mapa de eventos
            this.eventsMap.set(event, new Set());
        }
        let eventAux = this.eventsMap.get(event);
        if (eventAux && !eventAux.has(owner)) {
            // El evento no tiene registrado a ese propietario...
            // Se anade ese propietario al evento en el mapa de eventos
            eventAux.add(owner);
        }

        // PROPIETARIOS
        this.addToOwnersMap(event, owner, fn, this.ownersMap);
    }

    /**
     * Metodo para almacenar en los mapas un evento PERMANENTE
     * @param {EventName} event - nombre del evento 
     * @param {Owner} owner - objeto que se suscribe al evento
     * @param {EventFn} fn - funcion que se ejecuta al producirse el evento
     */
    private addAsPermanent(event: EventName, owner: Owner, fn: EventFn) {
        this.addToOwnersMap(event, owner, fn, this.ownersPermanentMap);
    }

    /**
     * Metodo para almacenar un evento en el mapa de propietarios
     * @param {EventName} event - nombre del evento 
     * @param {Owner} owner - objeto que se suscribe al evento
     * @param {EventFn} fn - funcion que se ejecuta al producirse el evento
     * @param {Map} ownersMap - mapa de propietarios en el que se va a guardar el evento
     */
    private addToOwnersMap(event: EventName, owner: Owner, fn: EventFn, ownersMap: Map<Owner, Map<EventName, Set<EventFn>>>) {
        // PROPIETARIOS
        if (!ownersMap.has(owner)) {
            // El propietario no existe...
            // Se crea el propietario en el mapa de propietarios correspondiente
            ownersMap.set(owner, new Map());
        }
        let ownerAux = ownersMap.get(owner);
        if (ownerAux) {
            if (!ownerAux.has(event)) {
                // El propietario no esta suscrito a ese evento...
                // Se crea el evento para ese propietario en el mapa de propietarios correspondiente
                ownerAux.set(event, new Set());
            }
            let ownerEventAux = ownerAux.get(event);
            // Se anade la funcion de ese evento para ese propietario en el mapa de propietarios correspondiente
            // Nota: si se ha llegado a este punto esta funcion no esta registrada porque si lo estuviera habria salido que ya existe esa suscripcion
            ownerEventAux?.add(fn);
        }
    }

    /**
    * Metodo para suscribir un objeto a un evento una sola vez
    * @param {EventName} event - nombre del evento
    * @param {Owner} owner - objeto que se suscribe al event (contexto)
    * @param {EventFn} fn - funcion que se ejecuta cuando se produce el evento
    */
    public addOnce(event: EventName, owner: Owner, fn: EventFn) {
        this.emitter.once(event, fn, owner);
    }

    /**
     * @param {EventName} event - nombre del evento 
     * @param {Owner} owner - objeto suscrito al evento 
     * @param {EventFn} fn - funcion que ejecuta al producirse el evento
     */
    public deepRemove(event: EventName, owner: Owner, fn: EventFn) {
        // Si existe el propietario... 
        if (this.ownersMap.has(owner)) {
            let events = this.ownersMap.get(owner);
            // Si existe el evento...
            if (events && events.has(event)) {
                let ownerEventAux = events.get(event);
                // Si existe la funcion...
                if (ownerEventAux && ownerEventAux.has(fn)) {
                    // Se desuscribe la funcion del evento que corresponde a cierto propietario
                    ownerEventAux.delete(fn);

                    this.emitter.off(event, fn, owner);
                }
            }
        }
    }

    /**
    * Metodo para desuscribir a todos los objetos de un evento concreto TEMPORAL
    * @param {EventName} event - nombre del evento
    */
    public removeByEvent(event: EventName) {
        // Existe el evento...
        if (this.eventsMap.has(event)) {
            let owners = this.eventsMap.get(event);
            // Se actualiza el mapa de propietarios
            owners?.forEach(owner => {
                let events = this.ownersMap.get(owner)
                events?.delete(event);
            });

            // Se elimina el evento
            this.emitter.off(event);

            // Se actualiza el mapa de eventos
            this.eventsMap.delete(event);
        }
    }

    /**
    * Metodo para desuscribir a un objeto de todos sus eventos TEMPORALES
    * @param {Owner} owner - objeto suscrito al evento
    */
    public removeByOwner(owner: Owner) {
        // Si existe el propietario...
        if (this.ownersMap.has(owner)) {
            // Se obtienen todos los eventos del propietario (map)
            let events = this.ownersMap.get(owner);
            // Se recorre cada evento
            events?.forEach((functions, eventName) => {
                // Se elimina el propietario de ese evento en el mapa de eventos
                let eventAux = this.eventsMap.get(eventName)
                eventAux?.delete(owner);

                // Se desuscribe el propietario de cada evento por cada funcion que tenga suscrita
                // (no es lo habitual, pero podria darse el caso que un
                // mismo propietario estuviera suscrito a un mismo evento con varias funciones)
                functions.forEach(fn => {
                    this.emitter.off(eventName, fn, owner);
                });
            });

            // Se actualiza el mapa de propietarios
            this.ownersMap.delete(owner);
        }
    }

    /**
    * Metodo para desuscribir a un objeto de un evento concreto TEMPORAL
    * @param {EventName} event - nombre del evento
    * @param {Owner} owner - objeto suscrito al evento
    */
    public remove(event: EventName, owner: Owner) {
        // Existe el evento...
        if (this.eventsMap.has(event)) {
            // Existe el propietario...
            let eventAux = this.eventsMap.get(event);
            if (eventAux && eventAux.has(owner)) {
                // Se actualiza el mapa de eventos
                eventAux.delete(owner);

                // Se desuscriben todas las funciones del propietarios que estan suscritas a ese evento
                // (a partir del mapa de propietarios)
                let events = this.ownersMap.get(owner)
                if (events) {
                    let ownerEventAux = events.get(event);
                    ownerEventAux?.forEach(fn => {
                        this.emitter.off(event, fn, owner);
                    });

                    // Se actualiza el mapa de propietarios
                    events.delete(event);
                }
            }
        }
    }

    /**
    * Metodo para eliminar todos los eventos TEMPORALES
    * Nota: si no hay comunicacion entre escenas, es recomendable llamarlo por cada
    * cambio de escenas para mejorar el rendimiento
    */
    public removeAll() {
        this.emitter.shutdown();
        this.eventsMap.clear();
        this.ownersMap.clear();

        // Se recorre el mapa permanente de propietarios...
        this.ownersPermanentMap.forEach((events, owner) => {
            // Se recorren los eventos de ese propietario...
            events.forEach((functions, eventName) => {
                // Se recorre cada una de las funciones de ese evento...
                functions.forEach((fn) => {
                    // SE VUELVE A SUSCRIBIR PORQUE SON PERMANENTES
                    this.emitter.on(eventName, fn, owner);
                });
            });
        });
    }

    /**
     * Metodo para limpiar por completo el emisor, por lo tanto,
     * se eliminan tanto eventos TEMPORALES como PERMANENTES
     */
    clear() {
        this.emitter.shutdown();
        this.eventsMap.clear();
        this.ownersMap.clear();
        this.ownersPermanentMap.clear();
    }
}