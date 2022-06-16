import gsap from 'gsap/all'
import { module } from 'modujs'
// import { Pane } from 'tweakpane';
// import * as EssentialsPlugin from '@tweakpane/plugin-essentials';
import Mouse from '../classes/Mouse/Mouse'
import Experiences from '../experiences/Experiences'
import { isDebug } from '../utils/environment'

const PANE_ENABLED = false;

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)
        this.onUpdateBind = this.onUpdate.bind(this)
        this.onPointerDownBind = this.onPointerDown.bind(this)
        this.onPointerUpBind = this.onPointerUp.bind(this)
        this.onMouseEnterBind = this.onMouseEnter.bind(this)
        this.onMouseLeaveBind = this.onMouseLeave.bind(this)

        // DOM
        this.$navItems = this.$('navItem')
        this.$inner = this.$('inner')[0]
        this.$overlay = this.$('overlay')[0]
        this.$interactiveArea = this.$('interactiveArea')[0]
        this.$navItems = this.$('navItem')

        // State RAF
        this.isRafPlaying = false

        // Hold state
        this.hasHoldAvailable = false

        // Data
        this.imagesData = this.getData('images');
        this.hasAssetsLoaded = false
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        if (!this.imagesData) {
            console.warn('You need images to start the experience')
        }

        // Set images
        this.images = JSON.parse(this.imagesData)

        // init
        this._init ? .()

        if (PANE_ENABLED) {
            // Set pane
            this.createPane()
            this.setupPane()
        }

        // Init canvas
        this.initCanvas()

        // Events Binding
        this.bindEvents()

        // On font loaded
        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }

        // Pause scroll
        this.call('stop', null, 'Scroll')

        requestAnimationFrame(() => {
            this.call('setCursorState', '', 'Cursor')
        })
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
        this.canvas ? .destroy ? .()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("resizeEnd", this.onResizeBind)
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)

        this.el.addEventListener("pointerdown", this.onPointerDownBind);
        this.el.addEventListener("pointerleave", this.onPointerUpBind);
        this.el.addEventListener("pointerup", this.onPointerUpBind);

        this.$interactiveArea ? .addEventListener('mouseenter', this.onMouseEnterBind)
        this.$interactiveArea ? .addEventListener('mouseleave', this.onMouseLeaveBind)
        this.$interactiveArea ? .addEventListener("pointerdown", this.onPointerDownBind);
        this.$interactiveArea ? .addEventListener("pointerup", this.onPointerUpBind);
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)

        this.el.removeEventListener("pointerdown", this.onPointerDownBind);
        this.el.removeEventListener("pointerleave", this.onPointerUpBind);
        this.el.removeEventListener("pointerup", this.onPointerUpBind);

        this.$interactiveArea ? .removeEventListener('mouseenter', this.onMouseEnterBind)
        this.$interactiveArea ? .removeEventListener('mouseleave', this.onMouseLeaveBind)
        this.$interactiveArea ? .removeEventListener("pointerdown", this.onPointerDownBind);
        this.$interactiveArea ? .removeEventListener("pointerup", this.onPointerUpBind);
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        // Launch canvas resize
        this.canvas ? .resize ? .()
    }

    onFontsLoaded() {
        // Launch canvas resize
        this.canvas ? .resize ? .()

        // Load assets
        this.canvas ? .loadAssets ? .().then(() => {

            // Emit experience ready
            const experienceEvent = new CustomEvent("experienceReady");
            window.dispatchEvent(experienceEvent);

            // Assets loaded
            this.hasAssetsLoaded = true
        })
    }

    onUpdate(time, deltaTime, frame) {
        this.fpsGraph ? .begin ? .();

        // Launch canvas update
        this.canvas ? .update ? .(time, deltaTime, frame)

        // Lauch canvas mouse
        this.canvas ? .mouseMove ? .({
            x: Mouse.x,
            y: Mouse.y,
            smoothX: Mouse.smoothX,
            smoothY: Mouse.smoothY
        })

        this.fpsGraph ? .end ? .();
    }

    onPointerDown(e) {
        this.pointerDownTime = Date.now()

        // Launch canvas event
        if (e.pointerType != 'touch')
            this.canvas ? .pointerDown ? .()
    }

    onPointerUp(e) {
        // Launch canvas event
        if (e.pointerType != 'touch')
            this.canvas ? .pointerUp ? .()

        if (e.currentTarget == this.$interactiveArea) {
            if (Date.now() - this.pointerDownTime < 100) {
                this.canvas ? .click ? .(e)
            }
        }
    }

    onMouseEnter() {
        this.canvas ? .mouseEnter ? .()
    }

    onMouseLeave() {
        this.canvas ? .mouseLeave ? .()
    }

    onProgress(progress) {
        if (this.$inner) {
            gsap.set(this.$inner, { y: `${progress*-10}%`, scale: 1 + progress * .1, force3D: true })
            gsap.set(this.$overlay, { opacity: progress * 0.8 })
        }
    }

    ///////////////
    // Methods
    ///////////////
    initCanvas() {
        this.canvas = new Experiences({
            $el: this.$inner,
            moduleInstance: this,
            images: this.images,
            paneObj: this.paneObj
        })
    }

    revealExperience() {
        this.canvas ? .revealExperience ? .()
    }

    // RAF
    ///////////////
    play() {
        if (this.isRafPlaying) return

        this.isRafPlaying = true

        // Enable interactivity
        if (this.hasAssetsLoaded) {
            this.hasHoldAvailable = true
        }

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
        this.paneObj.pane.registerPlugin(EssentialsPlugin);
        this.paneObj.params = {}
        this.paneObj.pane.containerElem_.style.zIndex = 1000;
        this.paneObj.pane.hidden = true

        const onKeyUp = (e) => {
            if (e.key == 'Escape') {
                this.paneObj.pane.hidden = !this.paneObj.pane.hidden
            }
        }
        window.addEventListener('keyup', onKeyUp);
    }

    setupPane() {
        this.paneObj.pane.addButton({
            title: "Close"
        }).on('click', () => {
            this.paneObj.pane.hidden = true
        })

        this.fpsGraph = this.paneObj.pane.addBlade({
            view: 'fpsgraph',
            label: 'fpsgraph',
            lineCount: 2,
            interval: 80
        });

        // folder.addInput(this.material.uniforms.uHasGrid, 'value', {
        //     label: 'Grid'
        // }).on('change', (ev) => {
        //     this.offscreen.toggleGrid(ev.value);
        // });
    }
}