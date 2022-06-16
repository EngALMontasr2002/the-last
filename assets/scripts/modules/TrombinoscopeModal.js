import { default as Modal } from './AbstractModal';
import { loadImage } from '../utils/image';
import { gsap, SplitText } from 'gsap/all';
gsap.registerPlugin(SplitText)

const CLASS = 'u-anim-text'

export default class extends Modal {
    /**
     * The CSS class name to apply to `<html>` to mark the modal as open.
     *
     * @var {string}
     */
    activeClass = 'has-trombinoscope-open'

    constructor(m) {
        super(m);

        // Binding
        this.onResizeSplitBind = this.onResizeSplit.bind(this)
        this.onUpdateLoadingBind = this.onUpdateLoading.bind(this)

        // UI
        this.$anim = this.$('anim')[0]
        this.$quote = this.$('quote')[0]
        this.$firstname = this.$('firstname')[0]
        this.$lastname = this.$('lastname')[0]
        this.$job = this.$('job')[0]
        this.$visual = this.$('visual')[0]

        // Loading data
        this.loadingData = {
            elapsedTime: 0,
            loadingDuration: 600,
            isLoading: false,
            isReady: false
        }

        // Hidden text per default
        this.isHidden = true

        // No split as default
        this.splitType = 'lines'
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {}

    unbindEvents() {}

    bindSplitEvents() {
        window.addEventListener("resizeEnd", this.onResizeSplitBind)
    }

    unbindSplitEvents() {
        window.removeEventListener("resizeEnd", this.onResizeSplitBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onInit() {}

    onDestroy() {}

    onClose() {
        this.killLoading()
        this.hide()
    }

    onOpen(args) {
        this.loadData(args)
    }

    onUpdateLoading(time, deltaTime, frame) {
        this.loadingData.elapsedTime += deltaTime

        if (this.loadingData.elapsedTime > this.loadingData.loadingDuration && this.loadingData.isReady) {
            this.stopLoading()
            this.onLoaded()
        }
    }

    onLoaded() {
        this.show()
    }

    onResizeSplit() {
        this.initSplits()
    }

    ///////////////
    // Methods
    ///////////////
    loadData(args) {
        this.playLoading()

        if (args ? .image) {
            loadImage(args.image).then((imageObj) => {
                this.populate(args, imageObj)
            })
        } else {
            this.populate(args, null)
        }
    }

    populate(data, loadedImage) {
        // Image
        if (loadedImage) {
            const imageTemplate = (src = '', caption = '') => `
                <figure class="c-trombinoscope-modal_image || c-figure">
                    <div class="c-figure_inner">
                        <img
                            class="c-figure_image || js-image"
                            src="${src}"
                            alt="${caption}"
                        >
                    </div>
                    <figcaption class="u-screen-reader-text">${caption}</figcaption>
                </figure>
            `
            if (loadedImage ? .url) {
                this.$visual.innerHTML = imageTemplate(loadedImage.url, data ? .name)
            } else {
                this.$visual.innerHTML = ''
            }
        } else {
            this.$visual.innerHTML = ''
        }

        // Quote
        if (data.quote) {
            this.$quote.innerHTML = `${data.quote}`
        } else {
            this.$quote.innerHTML = ''
        }

        // Firstname
        if (data.firstName) {
            this.$firstname.innerHTML = data.firstName
        } else {
            this.$firstname.innerHTML = ''
        }

        // Lastname
        if (data.lastName) {
            this.$lastname.innerHTML = data.lastName
        } else {
            this.$lastname.innerHTML = ''
        }

        // Job
        if (data.occupation) {
            this.$job.innerHTML = data.occupation
        } else {
            this.$job.innerHTML = ''
        }

        // Set loading ready
        requestAnimationFrame(() => {
            this.loadingData.isReady = true
        })
    }

    playLoading() {
        if (this.loadingData.isLoading) return
        this.loadingData.elapsedTime = 0
        this.loadingData.isLoading = true
        gsap.ticker.add(this.onUpdateLoadingBind)

        this.el.classList.add('is-loading')
    }

    stopLoading() {
        if (!this.loadingData.isLoading) return
        this.loadingData.isLoading = false
        gsap.ticker.remove(this.onUpdateLoadingBind)

        this.el.classList.remove('is-loading')
    }

    killLoading() {
        this.stopLoading()
        this.loadingData.isReady = false
    }

    show() {
        this.split = ''

        requestAnimationFrame(() => {
            this.initSplits()
            this.bindSplitEvents()
            this.el.classList.add('is-show')

            gsap.delayedCall(.6, () => {
                this.$anim.classList.add('is-active')
            });
        })
    }

    hide() {
        this.el.classList.remove('is-show')
        this.$anim.classList.remove('is-active')

        gsap.delayedCall(.6, () => {
            this.unbindSplitEvents()
        });
    }

    initSplits() {
        // Splt text
        this.split = new SplitText(this.$quote, {
            type: this.splitType,
            linesClass: `${CLASS}_line`,
            wordsClass: `${CLASS}_word`,
            charsClass: `${CLASS}_char`
        })

        // Add number of lines props to container
        const totalLines = this.split.lines.length
        this.$quote.style.setProperty('--anim-text-total-lines', totalLines);

        // Add line index to each lines
        this.split.lines.forEach(($line, i) => {
            $line.style.setProperty('--anim-text-line-index', i)
        })

        // Add chars index to each char
        const totalChars = this.split.chars.length
        if (totalChars > 0) {
            this.$quote.style.setProperty('--anim-text-total-chars', totalChars);
            this.split.chars.forEach(($char, i) => {
                $char.style.setProperty('--anim-text-char-index', i)
            })
        }
    }
}