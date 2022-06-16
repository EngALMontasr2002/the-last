import * as THREE from "three"
// import typefaceFont from 'three/examples/fonts/helvetiker_regular.typeface.json';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { gsap } from 'gsap/all'
import { getTexture } from "../../../utils/webgl/getTexture"
import TypoOffscreen from './TypoOffscreen'
import fragment from "./shaders/fragment.glsl"
import vertex from "./shaders/vertex.glsl"
// console.log(typefaceFont);

const HOLD_DURATION = 1000
const CURVESEGMENTS = 4;

const delay = ms => new Promise(res => setTimeout(res, ms));

export default class Typo {
    constructor({ scene, renderer, paneObj, moduleInstance }) {
        // Args
        this.scene = scene
        this.renderer = renderer
        this.paneObj = paneObj
        this.moduleInstance = moduleInstance

        // Init
        this.init()
    }

    ///////////////
    // Lifecycle
    ///////////////
    async init() {
        console.log(`${this.moduleInstance.playgroundId}: init`)

        await this.loadFonts();
        this.setTextData();
        this.setScene();
        this.setTimeline();

        // Setup pane
        this.setupPane()
    }

    destroy() {
        console.log(`${this.moduleInstance.playgroundId}: destroy`)
        this.timeline ? .kill ? .()
    }

    ///////////////
    // Events
    ///////////////
    async resize() {
        console.log(`${this.moduleInstance.playgroundId}: resize`)

        await this.loadFonts();
        this.setTextData();
        this.setScene();
        this.setTimeline();
    }

    update(time, deltaTime, frame) {
        // Increment time
        this.time += 0.01

        // Update hold status
        this.updateHold()
    }

    pointerDown() {
        this.holdDown()
    }

    pointerUp() {
        this.holdUp()
    }

    ///////////////
    // Methods
    ///////////////
    async loadFonts() {
        // LOAD FONTS
        this.fonts = {}
        const fontLoader = new FontLoader()
        const fontPromises = []
        const fonts = [{
                name: 'Lexend',
                file: '/assets/fonts/Lexend-Regular_restricted.json'
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
                    font.file,
                    (fontface) => {

                        this.fonts[font.name] = fontface
                        resolve()
                    }
                )
            }));
        }

        await Promise.all(fontPromises);
    }

    setTextData() {
        if (window.innerWidth >= 1000) {
            const FONT_SIZE = 0.1;

            this.textData = [{
                    value: 'We Create',
                    align: 'center',
                    font: 'Lexend',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: FONT_SIZE * 1.2
                    }
                },
                {
                    value: 'Havens',
                    align: 'right',
                    font: 'Lexend',
                    size: FONT_SIZE,
                    position: {
                        x: -0.025,
                        y: FONT_SIZE * 0
                    }
                },
                {
                    value: 'Endless',
                    align: 'left',
                    font: 'LibreCaslonItalic',
                    size: FONT_SIZE,
                    position: {
                        x: 0.05,
                        y: FONT_SIZE * -1.3
                    }
                },
                {
                    value: 'for',
                    align: 'right',
                    font: 'Lexend',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: FONT_SIZE * -1.3
                    }
                },
                {
                    value: 'Wonder.',
                    align: 'left',
                    font: 'LibreCaslonRegular',
                    size: FONT_SIZE,
                    position: {
                        x: -0.15,
                        y: FONT_SIZE * -2.5
                    }
                }
            ];
        } else {
            const FONT_SIZE = 0.05;

            this.textData = [{
                    value: 'We Create',
                    align: 'center',
                    font: 'Lexend',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: FONT_SIZE * 1.2
                    }
                },
                {
                    value: 'Havens',
                    align: 'center',
                    font: 'Lexend',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: 0
                    }
                },
                {
                    value: 'for Endless',
                    align: 'center',
                    font: 'LibreCaslonItalic',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: FONT_SIZE * -1.3
                    }
                },
                {
                    value: 'Wonder.',
                    align: 'center',
                    font: 'LibreCaslonRegular',
                    size: FONT_SIZE,
                    position: {
                        x: 0,
                        y: FONT_SIZE * -2.5
                    }
                }
            ];
        }
    }

    clearScene() {
        this.scene.clear();
    }

    setScene() {
        this.clearScene();
        // const axesHelper = new THREE.AxesHelper()
        // this.scene.add(axesHelper)

        this.chars = [];

        for (let i = 0; i < this.textData.length; i++) {
            // this.textData[i].characters = [];
            const text = this.textData[i];

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
                this.scene.add(mesh)

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


    }

    reveal() {
        this.timeline.restart()
    }

    // HOLD
    ///////////////

    holdDown() {
        if (this.isHolding) return

        // Reset base time
        this.holdBaseTime = Date.now()
            // Set flag
        this.isHolding = true

        this.moduleInstance.call('holdDown', HOLD_DURATION, 'Cursor')
            // this.offscreen.hide()
    }

    holdUp(isComplete = false) {
        if (!this.isHolding) return
            // Set flag
        this.isHolding = false
            // Stop cursor animation
        this.moduleInstance.call('holdUp', HOLD_DURATION, 'Cursor')
            // Animate gl hold
        if (!isComplete) {
            // this.offscreen.show()
        }
    }

    updateHold() {
        if (!this.isHolding) return

        const dateNow = Date.now()
        const elapsedTime = dateNow - this.holdBaseTime

        // If minimum duration passed
        if (elapsedTime > HOLD_DURATION) {
            this.holdUp(true)
            this.reveal()
        }
    }

    ///////////////
    // PANE
    ///////////////
    setupPane() {
        if (!this.paneObj) return

        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: 'Typo',
            expanded: true
        });
    }
}