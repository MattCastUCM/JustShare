import { Condition, Dialog, NodeType, Event, Choice } from "../../../types/dialogNode"

export class DialogNode {
    /**
    * Clase base para la informacion de los nodos de dialogo. Inicialmente esta todo vacio
    */
    type: NodeType
    id: string
    next: (DialogNode | string)[]
    fullId: string
    nextDelay: number

    constructor() {
        this.type = "dialog";               // dialog, choice, condition, event, chatMessage, socialNetMessage
        this.id = "";                 // id de este nodo dentro del objeto en el que se encuentra
        this.next = [];                 // posibles nodos siguientes
        this.fullId = "";             // id completa del nodo en el archivo en general
        this.nextDelay = 0;             // retardo con el que se procesara el siguiente nodo
    }
}

export class TextNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de texto
    * @extends DialogNode
    * 
    * Ejemplo:
        {
            "type": "text",
            "character": "mom",
            "next": "setNotTalked"
            "centered": "true"
        }
    */
    dialogs: Dialog[]
    currDialog: number
    character: string
    name: string
    centered: boolean

    constructor() {
        super();

        this.type = "text";
        this.dialogs = [];              // serie de dialogos que se van a mostrar
        this.currDialog = 0;         // indice del dialogo que se esta mostrando
        this.character = "";          // id del personaje que habla
        this.name = "";               // nombre del personaje que habla (si se trata del player, es el nombre elegido en la pantalla de login)
        this.centered = false;          // indica si el texto esta centrado o no (en caso de que no se especifique aparece alineado arriba a la izquierda)
    }
}

export class ChoiceNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de opcion multiple
    * @extends DialogNode
    * 
    * Ejemplo:
        {
            "type": "choice",
            "choices":[
                { "next": "choice1" },
                { "next": "choice1" }
            ]
        }
    */
    choices: Choice[]
    selectedOption: number

    constructor() {
        super();

        this.type = "choice";
        this.choices = [];              // Opciones (texto y si es un mensaje, de que chat y si que hay que responder)
        this.selectedOption = 0;     // indice de la opcion seleccionada
    }
}

export class SimilarityNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de similitud
    * @extends DialogNode
    * 
    * 
    * 
    * Ejemplo:
        {
            "type": "similarity",
            "threshold": 0.5,
            "method": "sentence_transformers",
            "character": "player",
            "choices": [
                {
                    "next": "friendly"
                },
                {
                    "next": "neutral"
                },
                {
                    "next": "shy"
                }
            ],
            "default": {
                "next": "default"
            }
        }
    */
    method: string
    threshold: number
    character: string
    choices: string[]
    summary: string

    constructor() {
        super();

        this.type = "similarity";
        this.method = "";
        this.threshold = 0;
        this.character = "";
        this.choices = [];
        this.summary = "";
    }
}

export class ConditionNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de condicion
    * @extends DialogNode
    * 
    * Ejemplo:
        {
            "type": "condition", 
            "conditions": [
                {
                    "next": "notTalked",
                    "talked": {
                        "value": false,
                        "operator": "equal",
                        "global": false,
                        "default": true,
                    },
                    "sponsored": {
                        "value": false,
                        "operator": "equal",
                        "type": "boolean"
                        "default": false,
                    }
                },
                {
                    "next": "talked",
                    "talked": {
                        "value": true,
                        "operator": "equal",
                    }
                }
            ]
        }
    */

    conditions: Condition<any>[]

    constructor() {
        super();

        this.type = "condition";
        this.conditions = [];           // condiciones con su nombre/identificador y sus atributos
    }
}

export class EventNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de evento
    * @extends DialogNode
    * Ejemplo:
        {
            "type": "event",
            "events": [
                { 
                    "talked": { 
                        "variable": "talked", 
                        "global": false,
                        "value": true, 
                        "delay": 20,
                    } 
                }
            ]
        }
    */
    events: Event[]

    constructor() {
        super();
        this.type = "event";
        this.events = [];               // eventos que se llamaran al procesar el nodo (nombre del evento y el retardo con el que se llama)
    }
}

export class ChatNode extends DialogNode {
    /**
    * Clase para la informacion de los nodos de los mensajes de los chats del movil
    * @extends DialogNode
    * Ejemplo:
        {
            "type": "chatMessage",
            "character": "player",
            "chat": "chat1",
            "replyDelay": 1000
        }
    */
    text: string
    character: string
    name: string
    chat: string
    replyDelay: number
    phone: boolean

    constructor() {
        super();

        this.type = "chatMessage";
        this.text = "";               // texto del mensaje
        this.character = "";          // id del personaje que envia el mensaje
        this.name = "";               // nombre del personaje que envia el mensaje (si se trata del jugador, es el nombre elegido en la pantalla de login)
        this.chat = "";               // chat al que corresponde el mensaje
        this.replyDelay = 0;            // retardo con el que se enviara el mensaje
        this.phone = true
    }
}

export class CommentaryNode extends DialogNode {
    /**
    * @extends DialogNode
    * Ejemplo:
        {
            "type": "commentary",
            "character": "player",
            "post": "post1",
            "replyDelay": 1000
        }
    */
    text: string
    character: string
    name: string
    pfp: string
    post: string
    replyDelay: number

    constructor() {
        super();

        this.type = "commentary";
        this.text = "";
        this.character = "";
        this.name = "";
        this.pfp = "";
        this.post = "";
        this.replyDelay = 0;
    }
}