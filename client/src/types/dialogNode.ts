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

type Operator = "equal" | "greater" | "lower" | "different"

export interface Condition<Type> {
    key: string;
    value: Type,
    operator: Operator
    global: boolean
    default: Type
    blackboard: Map<any, any>;
}

export interface Event {
    name: string;
    variable: string,
    global: boolean,
    value: any
}

export interface Choice {
    text: string;
    repeat: boolean;
}