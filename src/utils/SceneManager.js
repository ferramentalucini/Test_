export class SceneManager {
    constructor() {
        this.activeScene = null;
    }

    setActiveScene(scene) {
        if (this.activeScene) {
            this.activeScene.dispose();
        }
        this.activeScene = scene;
    }

    getActiveScene() {
        return this.activeScene;
    }
}