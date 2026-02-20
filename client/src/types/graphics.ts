import { GameObjects, } from "phaser";

export type RGB = {
    R: number;
    G: number;
    B: number;
};

type RenderComponents =
    GameObjects.Components.Visible &
    GameObjects.Components.AlphaSingle &
    GameObjects.Components.Transform;

export type RenderObject = GameObjects.GameObject & RenderComponents;