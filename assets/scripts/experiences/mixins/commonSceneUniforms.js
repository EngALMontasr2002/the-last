export default commonUniforms = {

    setResolutionUniforms(width, height) {
        this.material.uniforms.uResolution.value = [width, height]
    },

    setTextureUniforms(texture, uniform) {
        const texWidth = texture.image.width
        const texHeight = texture.image.height
        this.material.uniforms[uniform].value = texture
        this.material.uniforms[`${uniform}Resolution`].value = [texWidth, texHeight]
    },

}