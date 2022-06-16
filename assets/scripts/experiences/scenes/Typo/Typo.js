import * as THREE from "three"
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { gsap } from 'gsap/all'
import vertex from "../../shaders/vertex.glsl"
import commonSceneUniforms from "../../mixins/commonSceneUniforms"
import commonSceneMethods from "../../mixins/commonSceneMethods"
import { getTexture } from "../../../utils/webgl/getTexture"
import { lang, assetsVersion } from "../../../utils/environment"
import { mapLinear } from "three/src/math/MathUtils"
import TypoData from "./TypoData"

// TEXT CHARACTERS : ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz àâéèêïîùôöÀÂÉÈÊÏÎÙÔÖ"',./?!:;#@&-

const CURVESEGMENTS = 5;

export default class Typo {

    constructor({ id, $el, moduleInstance }) {

        // Mixin commons scene methods
        Object.assign(this, commonSceneMethods)
            // Mixin commons uniforms
        Object.assign(this, commonSceneUniforms)

        // DOM
        this.$el = $el

        // Data
        this.id = id
        this.moduleInstance = moduleInstance
        this.time = 0

        this.currentSlide = 0;

        this.viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        // Prepare render tartget stuff
        this.createScene ? .()
        this.createCamera ? .(true)
        this.createRtTexture ? .({ format: THREE.RGBFormat }, true)

        // Init Canvas
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    async init() {
        await this.loadFonts();
        this.setTextData();
        this.setScene();
        this.setTimeline();
    }

    setSlide(id) {
        this.currentSlide = id;
        this.setTextData(id);
        this.setScene();
        this.setTimeline();
    }

    ///////////////
    // Events
    ///////////////
    resize(width, height) {
        const aspect = width / height
        const aspectBreakpoint = 9 / 7
        const aspectChanged = (this.aspect >= aspectBreakpoint && aspect < aspectBreakpoint) || (this.aspect < aspectBreakpoint && aspect >= aspectBreakpoint);
        const widthBreakpoint = 450;
        const widthChanged = (this.viewport.width >= widthBreakpoint && width < widthBreakpoint) || (this.viewport.width < widthBreakpoint && width >= widthBreakpoint)

        this.compute(width, height);

        if (aspectChanged || widthChanged) {
            this.setTextData();
            this.setScene();
            const progress = this.timeline && this.timeline.progress ? this.timeline.progress() : 0
            this.setTimeline();
            this.timeline.progress(progress);
        }
    }

    update(time, deltaTime, frame) {
        this.time = time
    }

    mouseMove(mouseCoords) {
        const getCartesianCoordinates = (x, y) => {
            x = mapLinear(x, 0, this.viewport.width, -1, 1)
            y = mapLinear(y, 0, this.viewport.height, -1, 1)
            return {
                x: x + Math.cos(this.time * 0.5) * -0.66,
                y: y + Math.sin(this.time * 0.5) * -0.66
            }
        }

        const cartesianCoordinates = {
            raw: getCartesianCoordinates(mouseCoords.x, mouseCoords.y),
            smooth: getCartesianCoordinates(mouseCoords.smoothX, mouseCoords.smoothY),
        }

        if (this.group && this.group.position) {
            this.group.position.x = -cartesianCoordinates.smooth.x * 0.01
            this.group.position.y = -cartesianCoordinates.smooth.y * 0.01
        }
    }


    ///////////////
    // Methods
    ///////////////
    compute(width, height) {
        this.resizeRtTexture ? .(width, height)

        // Update camera
        const frustumSize = 1;
        this.aspect = width / height
        this.camera.left = frustumSize * this.aspect / -2
        this.camera.right = frustumSize * this.aspect / 2
        this.camera.top = frustumSize / 2
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix()

        this.viewport = {
            width: width,
            height: height
        }
    }

    async loadFonts() {
        // LOAD FONTS
        this.fonts = {}
        const fontLoader = new FontLoader()
        const fontPromises = []
        const fonts = [
            // {
            //     name: 'Lexend',
            //     file: '/assets/fonts/Lexend-Regular.json'
            // },
            {
                name: 'LexendLight',
                file: '/assets/fonts/Lexend-Light.json'
            },
            {
                name: 'LibreCaslonRegular',
                file: '/assets/fonts/LibreCaslonText_Regular.json'
            },
            {
                name: 'LibreCaslonItalic',
                file: '/assets/fonts/LibreCaslonText_Italic.json'
            }
        ];

        for (let font of fonts) {
            fontPromises.push(new Promise(resolve => {
                fontLoader.load(
                    font.file + '?v=' + assetsVersion,
                    (fontface) => {

                        this.fonts[font.name] = fontface
                        resolve()
                    }
                )
            }));
        }

        await Promise.all(fontPromises);
    }

    setTextData(id = this.currentSlide) {
        const isWide = eval(TypoData[id][lang].isWideCondition)

        if (isWide) {
            this.textData = TypoData[id][lang].wideData
        } else {
            this.textData = TypoData[id][lang].tallData
        }

        let fontSize;
        if (typeof this.textData['font-size'] === 'object') {
            fontSize = this.textData['font-size'].default;

            for (let modifier of this.textData['font-size'].modifiers) {
                if (eval(modifier.condition)) fontSize = modifier.value;
            }
        } else fontSize = this.textData['font-size']

        for (let i = 0; i < this.textData.blocks.length; i++) {
            this.textData.blocks[i].size = typeof this.textData.blocks[i].size === 'string' ? eval(fontSize + this.textData.blocks[i].size) : this.textData.blocks[i].size
            this.textData.blocks[i].position.x = typeof this.textData.blocks[i].position.x === 'string' ? eval(fontSize + this.textData.blocks[i].position.x) : this.textData.blocks[i].position.x
            this.textData.blocks[i].position.y = typeof this.textData.blocks[i].position.y === 'string' ? eval(fontSize + this.textData.blocks[i].position.y) : this.textData.blocks[i].position.y
        }
    }

    clearScene() {
        this.scene.clear();
    }

    setScene() {
        this.clearScene();
        // const axesHelper = new THREE.AxesHelper()
        // this.scene.add(axesHelper)

        this.group = new THREE.Group();

        this.chars = [];

        for (let i = 0; i < this.textData.blocks.length; i++) {
            // this.textData[i].characters = [];
            const text = this.textData.blocks[i];

            const textGeometry = new TextGeometry(
                text.value, {
                    font: this.fonts[text.font],
                    size: text.size,
                    height: 0,
                    curveSegments: CURVESEGMENTS
                }
            )
            textGeometry.computeBoundingBox();


            // Get boundings
            let x;
            let y = text.position.y;
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            switch (text.align) {
                case 'left':
                    x = text.position.x;
                    break;
                case 'center':
                    x = text.position.x - textWidth / 2
                    break;
                case 'right':
                    x = text.position.x - textWidth
                    break;
            }

            // const textTarget = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xff00, wireframe: false, transparent: true, opacity: .5 }))
            // textTarget.position.x = x - textGeometry.boundingBox.min.x
            // textTarget.position.y = y
            // this.scene.add(textTarget)

            // const debug1 = new THREE.Mesh(new THREE.BoxGeometry(textGeometry.boundingBox.max.x-textGeometry.boundingBox.min.x, textGeometry.boundingBox.max.y-textGeometry.boundingBox.min.y,0), new THREE.MeshBasicMaterial({wireframe: true, color: 0x00ffff }))
            // debug1.position.x = x + textWidth/2
            // debug1.position.y = y + (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y)/2
            // this.scene.add(debug1)

            //
            let offset = 0;
            const chars = text.value.split('')
            const lineChars = []
            for (let j = chars.length - 1; j >= 0; j--) {
                const charGeometry = new TextGeometry(
                    chars[j], {
                        font: this.fonts[text.font],
                        size: text.size,
                        height: 0,
                        curveSegments: CURVESEGMENTS
                    }
                )
                charGeometry.computeBoundingBox();
                charGeometry.translate(-charGeometry.boundingBox.max.x, 0, 0)

                const remainingGeometry = new TextGeometry(
                    text.value.slice(0, j), {
                        font: this.fonts[text.font],
                        size: text.size,
                        height: 0,
                        curveSegments: CURVESEGMENTS
                    }
                )
                remainingGeometry.computeBoundingBox();
                // console.log(chars[j]);
                let remainingWidth = remainingGeometry.boundingBox.max.x - remainingGeometry.boundingBox.min.x;

                const position = {
                    x: x + textWidth + offset,
                    y: y
                }

                const textMaterial = new THREE.ShaderMaterial({
                    extensions: {
                        derivatives: "#extension GL_OES_standard_derivatives : enable"
                    },
                    // side: THREE.DoubleSide,
                    uniforms: {
                        uOpacity: { value: 1 }
                    },
                    // wireframe: true,
                    transparent: true,
                    vertexShader: vertex,
                    fragmentShader: `
                        precision mediump float;
                        uniform float uOpacity;

                        void main() {
                           gl_FragColor = vec4(uOpacity,uOpacity,uOpacity,1.);
                        }
                    `
                })

                // const textMaterial = new THREE.MeshBasicMaterial({ wireframe: true })

                const mesh = new THREE.Mesh(charGeometry, textMaterial)
                mesh.position.x = position.x
                mesh.position.y = position.y
                this.group.add(mesh)

                // DEBUG
                // if(chars[j] != ' ') {
                //     const debug = new THREE.Mesh(new THREE.BoxGeometry(charGeometry.boundingBox.max.x-charGeometry.boundingBox.min.x, charGeometry.boundingBox.max.y-charGeometry.boundingBox.min.y,0), new THREE.MeshBasicMaterial({wireframe: true, color: 0xff0000 }))
                //     debug.position.x = position.x - (charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x)/2;
                //     debug.position.y = position.y + charGeometry.boundingBox.max.y/2;
                //     this.scene.add(debug)
                // }

                lineChars.push({
                        text,
                        value: chars[j],
                        mesh,
                        geometry: charGeometry,
                        position,
                        progress: 1,
                    })
                    // this.ctx.textAlign = 'right'
                    // this.ctx.fillText(this.textData[i].characters[0].value, this.textData[i].characters[0].position.x, this.textData[i].characters[0].position.y + (this.ctx.canvas.height * 0.125) * (1-this.textData[i].characters[0].progress));
                offset = remainingWidth - textWidth
            }
            lineChars.reverse()
            this.chars = this.chars.concat(lineChars)

            this.scene.add(this.group)
        }
    }

    setTimeline() {
        this.timeline = gsap.timeline({
            // repeat: -1,
            // repeatDelay: 1,
            onUpdate: () => {
                for (let char of this.chars) {
                    char.mesh.position.y = char.position.y - (char.text.size * (1 - char.progress));
                    char.mesh.material.uniforms.uOpacity.value = char.progress;
                }
            }
        })

        this.timeline.from(this.chars, {
            progress: 0,
            duration: 2,
            stagger: 0.03,
            ease: 'power4.out'
        })

        this.timeline.progress(0.01)
        this.timeline.pause();
        this.timeline.progress(0)
    }

    reveal(id = null) {
        if (id != null) this.setSlide(id)
        this.timeline.restart()
    }
}