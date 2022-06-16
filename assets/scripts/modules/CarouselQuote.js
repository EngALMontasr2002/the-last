import { gsap } from 'gsap/all';
import { module } from 'modujs'

// Warning: these infos are based on the experience to keep the design consistent
const EXPERIENCE_MASK_TEXTURE_WIDTH = 1440;
const EXPERIENCE_MASK_TEXTURE_HEIGHT = 794;
const DEFAULT_PORTAL_WIDTH = 259;

export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        this.onKeyBind = (e) => {
            if (
                e.key === "ArrowLeft" &&
                this.isInview
            ) {
                this.onPrev();
            } else if (
                e.key === "ArrowRight" &&
                this.isInview
            ) {
                this.onNext();
            }
        };


        // UI
        this.$el = this.el
        this.$wrapper = this.$('wrapper')[0]
        this.$slides = this.$('item')
        this.$images = this.$('image')
        this.$sentences = this.$('sentence')

        // Events
        this.events = {
            click: {
                prev: 'onPrev',
                next: 'onNext'
            }
        }

        // Data
        this.progressIndex = 0
        this.oldIndex = null
        this.currentIndex = 0
        this.direction = 1

        this.splitInstances = []
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents()

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
        document.addEventListener('keyup', this.onKeyBind)
    }

    unbindEvents() {
        window.removeEventListener("resizeEnd", this.onResizeBind)
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)
        document.removeEventListener('keyup', this.onKeyBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onResize() {
        this.computePortal()

        // Wait data to compute height
        requestAnimationFrame(() => {
            this.computeWrapperHeight()
                // Set computed height
            requestAnimationFrame(() => {
                this.call('update', null, 'Scroll')
            })
        })
    }

    onFontsLoaded() {
        this.computePortal()

        // Wait data to compute height
        requestAnimationFrame(() => {
            this.computeWrapperHeight()
                // Set computed height
            requestAnimationFrame(() => {
                this.call('update', null, 'Scroll')
            })
        })
    }

    onPrev() {
        if (this.isAnimating) return;

        // Get current index
        this.progressIndex = (this.progressIndex - 1) % this.$slides.length
        this.oldIndex = this.currentIndex
        this.currentIndex = Math.abs(this.progressIndex)
        this.direction = -1

        this.animeExit()
        this.animeHeight()
        this.animeEnter()

        this.$slides[this.oldIndex].classList.remove('is-active')
        this.$slides[this.oldIndex].classList.add('is-old')

        this.$slides[this.currentIndex].classList.remove('is-old')
        this.$slides[this.currentIndex].classList.add('is-active')
    }

    onNext() {
        if (this.isAnimating) return;

        // Get current index
        this.progressIndex = (this.progressIndex + 1) % this.$slides.length
        this.oldIndex = this.currentIndex
        this.currentIndex = Math.abs(this.progressIndex)
        this.direction = 1

        this.animeExit()
        this.animeHeight()
        this.animeEnter()

        this.$slides[this.oldIndex].classList.remove('is-active')
        this.$slides[this.oldIndex].classList.add('is-old')

        this.$slides[this.currentIndex].classList.remove('is-old')
        this.$slides[this.currentIndex].classList.add('is-active')
    }

    onEnterInView() {
        if (!this.isEntered) {
            this.animeEnter()
            this.$slides[this.currentIndex].classList.add('is-active')
            this.isEntered = true
        }

        this.isInview = true
    }

    onExitInView() {
        this.isInview = false
    }

    ///////////////
    // Methods
    ///////////////
    computeWrapperHeight() {
        // const heights = []
        // let itemIndex = 0
        // while (itemIndex < this.$slides.length) {
        //     const $slide = this.$slides[itemIndex]
        //     heights.push($slide.offsetHeight)
        //     itemIndex++
        // }
        // const currentHeight = Math.max(...heights)
        // this.$wrapper.style.height = `${currentHeight}px`

        // If auto height
        const $currentItem = this.$slides[this.currentIndex]
        const currentHeight = $currentItem.offsetHeight
        this.$wrapper.style.height = `${currentHeight}px`
    }

    computePortal() {
        // Compute mask max scale
        const maskTextureScale = this.computeMaskTextureScale()
            // Set interactive zone width
        this.setPictureWidth(maskTextureScale)
    }

    computeMaskTextureScale() {
        const canvasWidth = window.innerWidth
        const canvasHeight = window.innerHeight
        const originalTexWidth = EXPERIENCE_MASK_TEXTURE_WIDTH
        const originalTexHeight = EXPERIENCE_MASK_TEXTURE_HEIGHT

        const tAspect = originalTexWidth / originalTexHeight;
        const pAspect = canvasWidth / canvasHeight;
        const pwidth = canvasWidth;
        const pheight = canvasHeight;

        let currentTexWidth = 0;

        if (tAspect > pAspect) {
            currentTexWidth = pheight * tAspect;
        } else {
            currentTexWidth = pwidth;
        }

        return currentTexWidth / originalTexWidth
    }

    setPictureWidth(textureScale) {
        const portalWidth = Math.round(DEFAULT_PORTAL_WIDTH * textureScale)


        let imageIndex = 0;
        while (imageIndex < this.$images.length) {
            const $image = this.$images[imageIndex]
            $image.style.minWidth = `${portalWidth}px`

            requestAnimationFrame(() => {
                const width = $image.offsetWidth
                const portalRadius = width * .5
                $image.style.borderRadius = `${portalRadius}px ${portalRadius}px 0 0`
            })

            imageIndex++
        }
    }

    animeEnter() {
        this.isAnimating = true

        const translateX = 100 * this.direction;
        // const translateY = 75 * this.direction;
        const translateY = 30;
        const $selectedImage = this.$images[this.currentIndex]
        gsap.fromTo($selectedImage, {
            x: `${translateX}%`,
            y: `${translateY}%`,
            rotate: '15deg',
            autoAlpha: 0,
        }, {
            x: 0,
            y: 0,
            rotate: 0,
            autoAlpha: 1,
            duration: 1.2,
            ease: "power3.out",
            onComplete: () => {
                this.isAnimating = false
            }
        })
    }

    animeExit() {
        // console.log('animeExit')
        const translateX = -100 * this.direction;
        // const translateY = 75 * this.direction;
        const translateY = 30;
        const $selectedImage = this.$images[this.oldIndex]
        gsap.fromTo($selectedImage, {
            x: 0,
            y: 0,
            rotate: 0,
            autoAlpha: 1,
        }, {
            x: `${translateX}%`,
            y: `${translateY}%`,
            rotate: '-15deg',
            autoAlpha: 0,
            duration: 1.2,
            ease: "power3.out"
        })
    }

    animeHeight() {
        const $currentItem = this.$slides[this.currentIndex]
        const currentHeight = $currentItem.offsetHeight
        gsap.to(this.$wrapper, {
            height: currentHeight,
            duration: 1,
            ease: 'power2.out',
            onComplete: () => {
                this.call('update', null, 'Scroll')
            }
        })
    }

}