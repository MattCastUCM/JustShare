export abstract class Singleton {
    private static instances = new Map<Function, unknown>();

    protected constructor() { }

    static getInstance<T>(this: new () => T): T {
        let instance = Singleton.instances.get(this);

        if (!instance) {
            instance = new this();
            console.log(`Singleton instance created: ${this.name}.`);
            Singleton.instances.set(this, instance);
        }

        return instance as T;
    }
}
