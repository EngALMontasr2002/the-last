import { module } from 'modujs';
import { lazyLoadImage } from '../utils/image';
import LocomotiveScroll from 'locomotive-scroll';
import { html } from '../utils/environment';

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // Data
        this.currentTemplate = html.getAttribute('data-template')
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.initScroll()
        this.bindEvents()

        if (window.isFontsLoaded) {
            this.onFontsLoaded()
        }
    }

    destroy() {
        super.destroy()

        // Scroll
        this.scroll.destroy();

        // Events
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
    onFontsLoaded() {
        this.update()
    }

    onResize() {
        this.update()
    }


    ///////////////
    // Methods
    ///////////////

    initScroll() {
        // Scroll 
        this.scroll = new LocomotiveScroll({
            el: this.el,
            offset: [0, 0],
            smooth: true,
            tablet: {
                breakpoint: 1080
            }
        });

        this.scroll.on('call', (func, way, obj, id) => {
            // Using modularJS
            this.call(func[0], { way, obj }, func[1], func[2]);
        });

        this.scroll.on('scroll', (args) => {
            // Scroll class
            if (this.currentTemplate === "home") {
                if (args.scroll.y > window.innerHeight) {
                    html.classList.add('has-scrolled')
                } else {
                    html.classList.remove('has-scrolled')
                }
            } else if (args.scroll.y > 80) {
                html.classList.add('has-scrolled')
            } else {
                html.classList.remove('has-scrolled')
            }

            if (typeof args.currentElements['experience'] === 'object' && !this.scroll.options.isMobile && !this.scroll.options.isTablet) {
                let progress = args.currentElements['experience'].progress;
                this.call('onProgress', progress, 'Experiences')
            }

            // Push video progress
            if (typeof args.currentElements['pushVideo'] === 'object') {
                let progress = args.currentElements['pushVideo'].progress;
                this.call('onProgress', progress, 'PushVideo');
            }

            // Scroll quote progress
            if (typeof args.currentElements['scrollQuote'] === 'object') {
                let progress = args.currentElements['scrollQuote'].progress;
                this.call('onProgress', progress, 'ScrollQuote');
            }

            // Footer
            if (typeof args.currentElements['footer'] === 'object' && !this.scroll.options.isMobile && !this.scroll.options.isTablet) {
                let progress = args.currentElements['footer'].progress;
                this.call('onProgress', progress, 'FooterReveal');
            }
        });

        this.isSmooth()
    }

    /**
     * Lazy load the related image.
     *
     * @see ../utils/image.js
     *
     * It is recommended to wrap your `<img>` into an element with the
     * CSS class name `.c-lazy`. The CSS class name modifier `.-lazy-loaded`
     * will be applied on both the image and the parent wrapper.
     *
     * ```html
     * <div class="c-lazy o-ratio u-4:3">
     *     <img data-scroll data-scroll-call="lazyLoad, Scroll, main" data-src="http://picsum.photos/640/480?v=1" alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" />
     * </div>
     * ```
     *
     * @param {LocomotiveScroll} args - The Locomotive Scroll instance.
     */
    lazyLoad(args) {
        lazyLoadImage(args.obj.el, null, () => {
            //callback
        })
    }

    toggleExperiences(args) {
        let $target

        if (args.obj.target) {
            $target = args.obj.target
        } else if (args.obj.targetEl) {
            $target = args.obj.targetEl
        } else {
            return
        }

        const moduleID = $target.dataset.moduleExperiences

        if (args.way === "enter") {
            this.call('play', null, 'Experiences', moduleID)
        } else if (args.way === "exit") {
            this.call('pause', null, 'Experiences', moduleID)
        }
    }

    togglePushVideo(args) {
        let $target

        if (args.obj.target) {
            $target = args.obj.target
        } else if (args.obj.targetEl) {
            $target = args.obj.targetEl
        } else {
            return
        }

        const moduleID = $target.dataset.modulePushVideo

        if (args.way === "enter") {
            this.call('onEnter', null, 'PushVideo', moduleID)
        } else if (args.way === "exit") {
            this.call('onLeave', null, 'PushVideo', moduleID)
        }
    }

    toggleTrombinoscope(args) {
        let $target

        if (args.obj.target) {
            $target = args.obj.target
        } else if (args.obj.targetEl) {
            $target = args.obj.targetEl
        } else {
            return
        }

        const moduleID = $target.dataset.moduleTrombinoscope

        if (args.way === "enter") {
            this.call('play', null, 'Trombinoscope', moduleID)
        } else if (args.way === "exit") {
            this.call('pause', null, 'Trombinoscope', moduleID)
        }
    }

    toggleCarouselQuote(args) {
        let $target

        if (args.obj.target) {
            $target = args.obj.target
        } else if (args.obj.targetEl) {
            $target = args.obj.targetEl
        } else {
            return
        }

        const moduleID = $target.dataset.moduleCarouselQuote

        if (args.way === "enter") {
            this.call('onEnterInView', null, 'CarouselQuote', moduleID)
        } else if (args.way === "exit") {
            this.call('onExitInView', null, 'CarouselQuote', moduleID)
        }
    }

    toggleLightTheme(args) {
        let $target

        if (args.obj.target) {
            $target = args.obj.target
        } else if (args.obj.targetEl) {
            $target = args.obj.targetEl
        } else {
            return
        }

        const moduleID = $target.dataset.moduleLightTheme

        if (args.way === "enter") {
            this.call('onEnterInView', null, 'LightTheme', moduleID)
        } else if (args.way === "exit") {
            this.call('onExitInView', null, 'LightTheme', moduleID)
        }
    }

    isSmooth() {
        if (this.scroll.options.isMobile || this.scroll.options.isTablet) {
            window.isSmooth = false
        } else {
            window.isSmooth = true
        }
    }

    start() {
        this.scroll ? .start ? .()
    }

    stop() {
        this.scroll ? .stop ? .()
    }

    update() {
        this.scroll ? .update ? .()
    }

    scrollTo(params) {
        this.scroll ? .scrollTo ? .(params.target, params.options);
    }
}