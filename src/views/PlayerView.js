import { Actions, ActionAnimations } from '../models/Actions.js';

export class PlayerView {
    constructor(scene) {
        this.scene = scene;
        this.sprite = null;
        this.PLAYER_SCALE = 1.0;
    }

    preload() {
        const baseConfig = { frameWidth: 64, frameHeight: 64 };
        
        // Load all action animations
        Object.entries(ActionAnimations).forEach(([action, config]) => {
            const basePath = `./src/assets/sprites/Entities/Characters/Body_A/Animations/${config.spriteBase}/`;
            
            // Load down animation
            this.scene.load.spritesheet(
                `${config.spriteBase}-down`,
                `${basePath}${config.spriteBase.split('_')[0]}_Down-Sheet.png`,
                baseConfig
            );
            
            // Load side animation (used for both left and right)
            this.scene.load.spritesheet(
                `${config.spriteBase}-side`,
                `${basePath}${config.spriteBase.split('_')[0]}_Side-Sheet.png`,
                baseConfig
            );
            
            // Load up animation
            this.scene.load.spritesheet(
                `${config.spriteBase}-up`,
                `${basePath}${config.spriteBase.split('_')[0]}_Up-Sheet.png`,
                baseConfig
            );
        });
    }

    create(x, y) {
        // Create player sprite using the down idle sprite as initial texture
        this.sprite = this.scene.add.sprite(x, y, `${ActionAnimations[Actions.IDLE].spriteBase}-down`);
        this.sprite.setScale(this.PLAYER_SCALE);

        // Create all animations
        this.createAnimations();

        // Set up animation completion callback for non-repeating animations
        this.sprite.on('animationcomplete', (animation) => {
            const actionConfig = Object.values(ActionAnimations).find(
                config => Object.values(this.getDirectionKeys(config.animBase)).includes(animation.key)
            );
            
            if (actionConfig && actionConfig.repeat === 0 && this.onActionComplete) {
                this.onActionComplete();
            }
        });

        // Set initial animation
        this.sprite.play(`${ActionAnimations[Actions.IDLE].animBase}-down`);

        return this.sprite;
    }

    createAnimations() {
        // Create animations for each action and direction
        Object.entries(ActionAnimations).forEach(([action, config]) => {
            // Create down animation
            this.createActionAnimation(
                `${config.spriteBase}-down`,
                `${config.animBase}-down`,
                config
            );

            // Create side animation (used for both left and right)
            this.createActionAnimation(
                `${config.spriteBase}-side`,
                `${config.animBase}-left`,
                config
            );

            // Create up animation
            this.createActionAnimation(
                `${config.spriteBase}-up`,
                `${config.animBase}-up`,
                config
            );
        });
    }

    createActionAnimation(spriteKey, animationKey, config) {
        this.scene.anims.create({
            key: animationKey,
            frames: this.scene.anims.generateFrameNumbers(spriteKey, {
                start: 0,
                end: config.frameCount - 1
            }),
            frameRate: config.frameRate,
            repeat: config.repeat,
            yoyo: config.yoyo
        });
    }

    getDirectionKeys(animBase) {
        return {
            down: `${animBase}-down`,
            left: `${animBase}-left`,
            up: `${animBase}-up`
        };
    }

    update(x, y, direction, action) {
        // Update position
        this.sprite.setPosition(x, y);

        const config = ActionAnimations[action];
        if (!config) return;  // Invalid action

        // Determine sprite key and animation key based on direction
        let spriteKey, animationKey;
        
        if (direction === 'right') {
            this.sprite.setFlipX(false);
            spriteKey = `${config.spriteBase}-side`;
            animationKey = `${config.animBase}-left`;
        } else {
            this.sprite.setFlipX(false);
            if (direction === 'left') {
                spriteKey = `${config.spriteBase}-side`;
                animationKey = `${config.animBase}-${direction}`;
            } else {
                spriteKey = `${config.spriteBase}-${direction}`;
                animationKey = `${config.animBase}-${direction}`;
            }
        }

        // Only change animation if it's different
        if (this.sprite.anims.getName() !== animationKey) {
            this.sprite.setTexture(spriteKey);
            this.sprite.play(animationKey);
        }
    }
} 