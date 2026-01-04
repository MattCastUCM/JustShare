export default class Portrait {
    /**
    * Clase para un personaje y su retrato 
    * @param {Phaser.Scene} scene - escena a la que pertenece
    * @param {String} img - id de la imagen
    * @param {Object} trans - posicion y escala del personaje
    * @param {String} key - key del retrato en la escena
    */
    constructor(scene, img, trans, key) {
        this.scene = scene;
        this.img = scene.add.image(0, 0, img)
        this.img.setPosition(trans.x, trans.y);
        this.img.setScale(trans.scale);

        this.ANIM_EASE = 'linear';
        this.scale = trans.scale;
        this.deactiveScale = this.scale * 0.8;

        this.NO_TINT = Phaser.Display.Color.HexStringToColor('#ffffff');
        this.INACTIVE_TINT = Phaser.Display.Color.HexStringToColor('#454545');

        this.key = key;
        this.setAlpha(0);
    }
    
    getKey() { return this.key; }
    
    activate(active, duration, onComplete) {
        if (!duration) duration = 0;

        let anim = null;
        
        if (active) {
            this.img.alpha = 0;

            // Hace la animacion de fade out para todos los objetos
            anim = this.scene.tweens.add({
                targets: this.img,
                alpha: { from: 0, to: 1 },
                ease: this.ANIM_EASE,
                duration: duration,
                repeat: 0,
            });
        }
        else {
            this.img.alpha = 1;

            // Hace la animacion de fade out para todos los objetos
            anim = this.scene.tweens.add({
                targets: this.img,
                alpha: { from: 1, to: 0 },
                ease: this.ANIM_EASE,
                duration: duration,
                repeat: 0,
            });
        }

        if (onComplete !== null && typeof onComplete === 'function') {
            anim.on('complete', () => {
                onComplete();
            });

        }
    }

    setTalking(talking, duration, onComplete) {
        if (!duration) duration = 0;

        let anim = null;
        
        if (talking && this.img.scale != this.scale) {
            // Hace la animacion de iluminarse
            anim = this.scene.tweens.add({
                targets: this.img,
                ease: this.ANIM_EASE,
                duration: duration,
                scale: this.scale,
                repeat: 0,
            });

            // Para el fade de colores
            this.scene.tweens.addCounter({
                targets: [this.box],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.INACTIVE_TINT, this.NO_TINT, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                    this.img.setTint(colInt);
                },
                repeat: 0,
                repeat: 0,
                duration: duration
            });
        }
        else if (!talking && this.img.scale != this.deactiveScale) {
            // Hace la animacion de oscurecerse
            anim = this.scene.tweens.add({
                targets: this.img,
                ease: this.ANIM_EASE,
                duration: duration,
                scale: this.deactiveScale,
                repeat: 0,
            });

            // Para el fade de colores
            this.scene.tweens.addCounter({
                targets: [this.box],
                from: 0,
                to: 100,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    let col = Phaser.Display.Color.Interpolate.ColorWithColor(this.NO_TINT, this.INACTIVE_TINT, 100, value);
                    let colInt = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
                    this.img.setTint(colInt);
                },
                repeat: 0,
                duration: duration
            });
        }

        if (onComplete !== null && typeof onComplete === 'function') {
            anim.on('complete', () => {
                onComplete();
            });

        }
    }

    setDepth(depth) { this.img.setDepth(depth); }
    
    setFlipX(flip) { this.img.flipX = flip; }

    setAlpha(alpha) { this.img.alpha = alpha; }

    setPosX(x) {this.img.x = x; }
}