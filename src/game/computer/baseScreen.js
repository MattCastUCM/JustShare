export default class BaseScreen extends Phaser.GameObjects.Container {
    constructor(scene, screenName) {
        super(scene, 0, 0)

        this.scene.add.existing(this)
        
        this.CANVAS_WIDTH = this.scene.CANVAS_WIDTH;
        this.CANVAS_HEIGHT = this.scene.CANVAS_HEIGHT;

        this.NAMESPACE_PREFIX = 'computer/'
        this.screenName = screenName
        
        this.username = this.scene.username
        
        let bg = this.scene.createBackground(screenName)
        this.add(bg)
        
        this.init()
    }
    
    init() {
        this.scene.setNamespace(this.NAMESPACE_PREFIX + this.screenName)
    }

    reset() {
        
    }
}