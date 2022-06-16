import gsap from 'gsap/all'
import { module } from 'modujs'
import { lerp } from '../utils/maths';
import { transform } from '../utils/transform';
import isMobile from '../utils/isMobile'

// Get is mobile state
const isMobileObj = isMobile()
const IS_TOUCH_DEVICE = isMobileObj ? .phone || isMobileObj ? .tablet

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)
        this.onMouseEnterBind = this.onMouseEnter.bind(this)
        this.onMouseLeaveBind = this.onMouseLeave.bind(this)
        this.onMouseMoveBind = this.onMouseMove.bind(this)

        // UI
        this.$el = this.el
        this.$follow = this.$('follow')[0];
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        if (IS_TOUCH_DEVICE) return

        this.mouse = {
            x: 0,
            y: 0,
            lerpedX: 0,
            lerpedY: 0
        }

        this.lerp = 0.12;
        this.hasMoved = false;
        this.bcr = this.el.getBoundingClientRect();
        this.isAvailable = false;
        this.isHover = false;

        this.bindEvents()

        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }

        gsap.delayedCall(1, () => {
            this.resize();
            this.mouse.x = this.bcr.width - this.$follow.offsetWidth / 2;
            this.mouse.y = this.bcr.height - this.$follow.offsetHeight / 2;
            this.mouse.lerpedX = this.bcr.width - this.$follow.offsetWidth / 2;
            this.mouse.lerpedY = this.bcr.height - this.$follow.offsetHeight / 2;
            transform(this.$follow, `translate3d(${this.bcr.width / 2}px,${this.bcr.height / 2}px,0) translate3d(-50%, -50%, 0)`);
        })
    }

    destroy() {
        super.destroy()
        this.unbindEvents()
        this.raf && cancelAnimationFrame(this.raf);
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("resizeEnd", this.onResizeBind)
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)

        this.$el.addEventListener("mouseenter", this.onMouseEnterBind)
        this.$el.addEventListener("mouseleave", this.onMouseLeaveBind)
        this.$el.addEventListener("mousemove", this.onMouseMoveBind)
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)

        this.$el.removeEventListener("mouseenter", this.onMouseEnterBind)
        this.$el.removeEventListener("mouseleave", this.onMouseLeaveBind)
        this.$el.removeEventListener("mousemove", this.onMouseMoveBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        this.resize()
    }

    onFontsLoaded() {
        this.resize()
    }

    onMouseEnter(e) {
        if (IS_TOUCH_DEVICE) return;

        this.raf && cancelAnimationFrame(this.raf);

        this.isHover = true;
        if (!this.hasMoved) {
            this.hasMoved = true;
            this.el.classList.add('has-moved');
        }

        if (this.isHover) {
            this.mouse.x = e.clientX - this.bcr.left;
            this.mouse.y = e.clientY - this.bcr.top;
        }
        this.resize()

        this.isAvailable = true;

        this.animate();

        this.lerp = 0;

        requestAnimationFrame(() => {
            this.lerp = 0.12;
            this.el.classList.add('is-hovered');
        })
    }

    onMouseLeave() {
        if (IS_TOUCH_DEVICE) return;

        this.isHover = false;
        this.mouse.x = this.bcr.width - this.$follow.offsetWidth / 2;
        this.mouse.y = this.bcr.height - this.$follow.offsetHeight / 2;

        if (this.enterCallback !== undefined) {
            this.enterCallback.kill();
        }

        this.isAvailable = false;
        cancelAnimationFrame(this.raf);

        this.el.classList.remove('is-hovered');
    }

    onMouseMove(e) {
        if (this.isHover) {
            this.mouse.x = e.clientX - this.bcr.left;
            this.mouse.y = e.clientY - this.bcr.top;
        }

        this.resize()
    }

    ///////////////
    // Methods
    ///////////////
    resize() {
        this.windowWidth = window.innerWidth;
        this.windowHeight = window.innerHeight;
        this.bcr = this.el.getBoundingClientRect();
    }

    animate() {
        this.raf = requestAnimationFrame(() => this.animate());

        if (this.isAvailable) {
            this.mouse.lerpedX = lerp(this.mouse.lerpedX, this.mouse.x, this.lerp);
            this.mouse.lerpedY = lerp(this.mouse.lerpedY, this.mouse.y, this.lerp);
            transform(this.$follow, `translate3d(${this.mouse.lerpedX}px,${this.mouse.lerpedY}px,0) translate3d(-50%, -50%, 0)`)
        }
    }
}