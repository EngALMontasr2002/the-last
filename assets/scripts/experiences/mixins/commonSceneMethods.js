import * as THREE from "three"
import { isWebGL2Ready } from '../../utils/is'

export default commonSceneMethods = {
    // Scene
    createScene() {
        this.scene = new THREE.Scene()
    },

    // Camera
    createCamera(keepAspectRatio = false) {
        const frustumSize = 1
        this.aspect = keepAspectRatio ? window.innerWidth / window.innerHeight : 1
        this.camera = new THREE.OrthographicCamera(frustumSize * this.aspect / -2, frustumSize * this.aspect / 2, frustumSize / 2, frustumSize / -2, -1000, 1000)
        this.camera.position.set(0, 0, 2)
    },

    // Render Target Texture
    createRtTexture(options = {}, isMultisample = false) {
        const normalizedDpr = Math.min(window.devicePixelRatio, 2);

        if (isMultisample && isWebGL2Ready()) {
            this.rtTexture = new THREE.WebGLMultisampleRenderTarget(this.$el.offsetWidth * normalizedDpr, this.$el.offsetHeight * normalizedDpr, options);
        } else {
            this.rtTexture = new THREE.WebGLRenderTarget(this.$el.offsetWidth * normalizedDpr, this.$el.offsetHeight * normalizedDpr, options);
        }
    },

    resizeRtTexture(width, height) {
        const normalizedDpr = Math.min(window.devicePixelRatio, 2);

        this.rtTexture.setSize(width * normalizedDpr, height * normalizedDpr)
    }
}