import { module } from 'modujs'
import { gsap } from 'gsap/all'
import isMobile from '../utils/isMobile'
import Mouse from '../classes/Mouse/Mouse'

// Get is mobile state
const isMobileObj = isMobile()
const IS_TOUCH_DEVICE = isMobileObj ? .phone || isMobileObj ? .tablet

export default class extends module {
    constructor(m) {
        super(m)

        // data
        this.prevCursorState = ''
        this.holdPrevCursorState = ''
        this.cursorState = 'default'
        this.isPlaying = false

        // Binding
        this.onMouseEnterBind = this.onMouseEnter.bind(this)
        this.onMouseLeaveBind = this.onMouseLeave.bind(this)
        this.onResetCursorBind = this.onResetCursor.bind(this);
        this.onUpdateBind = this.onUpdate.bind(this)

        // UI
        this.$el = this.el
        this.$holdCircle = this.$('holdCircle')[0]
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.initCursor()
    }

    destroy() {
        super.destroy()
        this.destroyCursor()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        const $items = document.querySelectorAll(`[data-cursor]`)
        let itemIndex = 0

        while (itemIndex < $items.length) {
            const $item = $items[itemIndex]
            $item.addEventListener('mouseenter', this.onMouseEnterBind)
            $item.addEventListener('mouseleave', this.onMouseLeaveBind)
            itemIndex++
        }

        window.addEventListener('resetCursorBind', this.onResetCursorBind)
    }

    unbindEvents() {
        const $items = document.querySelectorAll(`[data-cursor]`)
        let itemIndex = 0

        while (itemIndex < $items.length) {
            const $item = $items[itemIndex]
            $item.addEventListener('mouseenter', this.onMouseEnterBind)
            $item.addEventListener('mouseleave', this.onMouseLeaveBind)
            itemIndex++
        }

        window.removeEventListener('resetCursorBind', this.onResetCursorBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onMouseEnter(e) {
        const $target = e.target
        const state = $target ? .dataset ? .cursor
        if (state) {
            this.setCursorState(state)
        }
    }

    onMouseLeave() {
        this.setCursorState('default')
    }

    onUpdate() {
        this.translateCursor(Mouse.smoothX, Mouse.smoothY)
    }

    onResetCursor() {
        this.setCursorState('default')
    }

    ///////////////
    // Methods
    ///////////////
    initCursor() {
        if (IS_TOUCH_DEVICE) return
        this.bindEvents()
        this.translateCursor(Mouse.x, Mouse.y)
        this.setCursorState('default')

        requestAnimationFrame(() => {
            this.play()
        })
    }

    destroyCursor() {
        if (IS_TOUCH_DEVICE) return
        this.unbindEvents()

        requestAnimationFrame(() => {
            this.setCursorState('')
            this.pause()
        })
    }

    play() {
        if (this.isPlaying) return
        this.isPlaying = true
        gsap.ticker.add(this.onUpdateBind)
    }

    pause() {
        if (!this.isPlaying) return
        this.isPlaying = false
        gsap.ticker.remove(this.onUpdateBind)
    }

    translateCursor(x, y) {
        this.$el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    setCursorState(state) {
        this.prevCursorState = this.cursorState
        this.cursorState = state

        this.$el.classList.remove(`-${this.prevCursorState}`)
        this.$el.classList.add(`-${this.cursorState}`)
    }

    holdDown(duration) {
        if (IS_TOUCH_DEVICE) return

        this.holdPrevCursorState = this.cursorState
        this.setCursorState('hold')

        this.holdAnimation ? .kill()
        this.holdAnimation = gsap.to(this.$holdCircle, {
            duration: duration / 1000,
            attr: {
                "stroke-dashoffset": 0
            },
            ease: 'linear'
        })
    }

    holdUp() {
        if (IS_TOUCH_DEVICE) return

        this.setCursorState(this.holdPrevCursorState)

        this.holdAnimation ? .kill()
        this.holdAnimation = gsap.to(this.$holdCircle, {
            duration: .3,
            attr: {
                "stroke-dashoffset": 91
            },
            ease: 'power2.out'
        })
    }
}