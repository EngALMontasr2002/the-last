// Source: https://github.com/ayamflow/three-tools/blob/master/src/get-texture.js

import { Texture } from 'three/src/textures/Texture'
import { CanvasTexture } from 'three/src/textures/CanvasTexture'
import { VideoTexture } from 'three/src/textures/VideoTexture'
import { LinearFilter, ClampToEdgeWrapping } from 'three/src/constants'

export const textureCache = {}

const pixel = new Image()
pixel.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs='

/**
 * Convenience method for loading and retrieving textures
 *
 * @module
 * @static
 * @param {string|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image The source image or its URL
 * @param {Object} [params={}] The texture parameters, including wrapping and filtering
 * @return {THREE.Texture}
 */
export function getTexture(image, params = {}) {
    let texture
    if (image instanceof Image || image instanceof HTMLVideoElement || image instanceof HTMLCanvasElement) {
        if (image instanceof HTMLVideoElement)
            texture = new VideoTexture(image)
        else if (image instanceof HTMLCanvasElement)
            texture = new CanvasTexture(image)
        else
            texture = new Texture(image)

        setParams(texture, params)
        return texture
    } else {
        // Cache
        let texture = textureCache[image]
        if (texture) {
            let needsUpdate = Object.keys(params).reduce(function(reduce, key, i) {
                    let value = params[key]
                    return reduce || value != texture[key]
                }, false)
                //console.log(needsUpdate)
            setParams(texture, params)
            texture.needsUpdate = true
            return texture
        }
        let img = new Image()
        texture = new Texture(pixel)
        textureCache[image] = texture
        texture.needsUpdate = false
        if (image.includes('d1oy1berrwa8q2.cloudfront')) {
            img.crossOrigin = "anonymous"
        }
        img.src = image
        texture.promise = new Promise((resolve, reject) => {
            img.onload = function() {
                img.onload = null
                texture.image = img
                setParams(texture, params)
                resolve(texture)
            }
        })

        return texture
    }
}

function setParams(texture, params = {}) {
    Object.assign(texture, {
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        generateMipmaps: false
    }, params)

    texture.needsUpdate = true
}