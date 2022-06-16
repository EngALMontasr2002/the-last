import gsap from 'gsap/all';
import { module } from 'modujs'
import { Pane } from 'tweakpane';
import Canvas from '../classes/Canvas/Canvas'
import Mouse from '../classes/Mouse/Mouse'

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)
        this.onUpdateBind = this.onUpdate.bind(this)
        this.onPointerDownBind = this.onPointerDown.bind(this)
        this.onPointerUpBind = this.onPointerUp.bind(this)

        // State RAF
        this.isRafPlaying = false

        // Hold state
        this.hasHoldAvailable = false
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        // init
        this._init ? .()

        // Events Binding
        this.bindEvents()

        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }

        // Set pane
        this.createPane()
        this.setupPane()

        // Init canvas
        this.initCanvas()

        // Raf subscribe
        // TODO: SCROLL CALL 
        this.play()
    }

    destroy() {
        super.destroy()

        // destroy
        this._destroy ? .()

        // Events unbinding
        this.unbindEvents()

        // Raf unsubscribe
        this.pause()

        // Destroy canvas
        this.playgroundCanvas ? .destroy ? .()

        // Dispose pane
        this.paneObj ? .pane ? .dispose ? .()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("resizeEnd", this.onResizeBind)
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)

        window.addEventListener("pointerdown", this.onPointerDownBind);
        window.addEventListener("pointerup", this.onPointerUpBind);
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)

        window.removeEventListener("pointerdown", this.onPointerDownBind);
        window.removeEventListener("pointerup", this.onPointerUpBind);
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        // Launch canvas resize
        this.playgroundCanvas ? .resize ? .()
    }

    onFontsLoaded() {
        // Launch canvas resize
        this.playgroundCanvas ? .resize ? .()
    }

    onUpdate(time, deltaTime, frame) {
        // Launch canvas update
        this.playgroundCanvas ? .update ? .(time, deltaTime, frame)

        // Lauch canvas mouse
        this.playgroundCanvas ? .mouseMove ? .({
            x: Mouse.x,
            y: Mouse.y,
            smoothX: Mouse.smoothX,
            smoothY: Mouse.smoothY
        })
    }

    onPointerDown() {
        // Launch canvas event
        this.playgroundCanvas ? .pointerDown ? .()
    }

    onPointerUp() {
        // Launch canvas event
        this.playgroundCanvas ? .pointerUp ? .()
    }


    ///////////////
    // Methods
    ///////////////
    initCanvas() {
        this.playgroundCanvas = new Canvas({
            $el: this.el,
            playgroundId: this.playgroundId,
            paneObj: this.paneObj,
            moduleInstance: this,
            hasBloomPass: this.hasBloomPass
        })
    }

    // RAF
    ///////////////
    play() {
        if (this.isRafPlaying) return

        this.isRafPlaying = true

        // Enable interactivity
        this.hasHoldAvailable = true

        gsap.ticker.add(this.onUpdateBind)
    }

    pause() {
        if (!this.isRafPlaying) return

        this.isRafPlaying = false

        // Disable interactivity
        this.hasHoldAvailable = false

        gsap.ticker.remove(this.onUpdateBind)
    }

    // Pane
    ///////////////
    createPane() {
        this.paneObj = {}
        this.paneObj.pane = new Pane()
        this.paneObj.params = {}
    }

    setupPane() {
        // Create folder
        const folder = this.paneObj.pane.addFolder({
            title: 'Common tools',
            expanded: false,
        });

        const toggleRafBtn = folder.addButton({
            title: 'Play/Pause',
            label: 'RAF', // optional
        });

        toggleRafBtn.on('click', () => {
            if (this.isRafPlaying) {
                this.pause()
            } else {
                this.play()
            }
        });

        ////////////////////////////////////////////////////////////////////////////// 

        requestAnimationFrame(() => {
            if (this.playgroundCanvas && this.playgroundCanvas.bloomPass) {
                // Create bloom folder
                const bloomFolder = this.paneObj.pane.addFolder({
                    title: 'Bloom',
                    expanded: false
                });

                // Strength
                this.paneObj.params.bloomStrength = this.playgroundCanvas.bloomPass.strength
                bloomFolder
                    .addInput(this.paneObj.params, 'bloomStrength', { min: 0, max: 2 })
                    .on('change', (ev) => {
                        const value = ev.value
                        this.playgroundCanvas.bloomPass.strength = value
                    });

                // Threshold
                this.paneObj.params.bloomThreshold = this.playgroundCanvas.bloomPass.threshold
                bloomFolder
                    .addInput(this.paneObj.params, 'bloomThreshold', { min: 0, max: 1 })
                    .on('change', (ev) => {
                        const value = ev.value
                        this.playgroundCanvas.bloomPass.threshold = value
                    });

                // Radius
                this.paneObj.params.bloomRadius = this.playgroundCanvas.bloomPass.radius
                bloomFolder
                    .addInput(this.paneObj.params, 'bloomRadius', { min: 0, max: 2 })
                    .on('change', (ev) => {
                        const value = ev.value
                        this.playgroundCanvas.bloomPass.radius = value
                    });
            }
        })
    }
}