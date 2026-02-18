export function hasTransform(object: unknown): object is Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform {
    return (
        typeof object === 'object' &&
        object !== null &&
        typeof (object as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform).setPosition === 'function'
    );
}

export function isPlainObject(value: any): value is Record<string, any> {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}