export type NodeType =
    | "dialog"
    | "text"
    | "choice"
    | "condition"
    | "event"
    | "chatMessage"
    | "commentary"
    | "similarity";

export type Dialog = {
    text: string;
    name: string;
};

export interface Condition<Type> {
    key: string;
    value: Type;
    operator: "equal" | "greater" | "lower" | "different";
    global: boolean;
    default: Type;
    blackboard: Map<any, any>;
}

export interface Event {
    name: string;
    variable: string;
    global: boolean;
    value: any;
    operator: "set" | "increment" | "decrement";
}

export interface Choice {
    text: string;
    repeat: boolean;
}

export interface SimilarityTransition {
    type: "text" | "chatMessage";
    chat: string;
    replyDelay?: number;
    phone: boolean;
}