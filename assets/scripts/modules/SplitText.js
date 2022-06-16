import { module } from 'modujs';
import { gsap, SplitText } from 'gsap/all';
gsap.registerPlugin(SplitText)

const CLASS = 'u-anim-text'

export default class AnimText extends module {

    // static get CLASS_NAME() {
    //     return 'u-anim-text'
    // }

    constructor(m) {
        super(m);

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // UI
        this.$el = this.el

        // Hidden text per default
        this.isHidden = true

        // No split as default
        this.splitType = 'lines'
            // this.splitType = 'lines, words'
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents()
            // this.$el.classList.add(CLASS.CONTAINER)

        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }
    }

    destroy() {
        super.destroy()
        this.unbindEvents()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        window.addEventListener("resizeEnd", this.onResizeBind)
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        this.initSplits()
    }

    onFontsLoaded() {
        this.initSplits()
    }

    ///////////////
    // Methods
    ///////////////
    initSplits() {

        if (this.split) this.revertSplits()

        requestAnimationFrame(() => {
            // Splt text
            this.split = new SplitText(this.$el, {
                type: this.splitType,
                linesClass: `${CLASS}_line`,
                wordsClass: `${CLASS}_word`,
                charsClass: `${CLASS}_char`
            })

            // Add number of lines props to container
            const totalLines = this.split.lines.length
            this.$el.style.setProperty('--anim-text-total-lines', totalLines);

            // Add line index to each lines
            this.split.lines.forEach(($line, i) => {
                $line.style.setProperty('--anim-text-line-index', i)
            })

            // Add chars index to each char
            const totalChars = this.split.chars.length
            if (totalChars > 0) {
                this.$el.style.setProperty('--anim-text-total-chars', totalChars);
                this.split.chars.forEach(($char, i) => {
                    $char.style.setProperty('--anim-text-char-index', i)
                })
            }
        })
    }

    revertSplits() {
        this.split.revert()
    }
}