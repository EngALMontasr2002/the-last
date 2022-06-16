import { module } from 'modujs';
import lottieLight from 'lottie-web/build/player/lottie_light';
import gsap from 'gsap/all';
import { CookieManager, COOKIES_TYPE, COOKIES_TYPE_DURATION } from '../classes/Cookies/CookieManager';

const LOTTIE_FOLDER = "/assets/data/lottie"

export default class extends module {
    constructor(m) {
        super(m);

        this.onAnimationLoadedBind = this.onAnimationLoaded.bind(this)
        this.onAnimationCompleteBind = this.onAnimationComplete.bind(this)
        this.onAnimationProgressBind = this.onAnimationProgress.bind(this)
        this.onUpdateBind = this.onUpdate.bind(this)

        this.animationPath = `${LOTTIE_FOLDER}/introduction.json`
        this.$container = this.$('container')[0]

        this.el.style.visibility = "hidden";

        this.isLoaded = false
        this.hasRevealPortal = false
    }

    init() {
        //if (!CookieManager.checkCookie(COOKIES_TYPE.SKIP_INTRO_COOKIE)) {
        if (!window.isNotFirstLoading) {
            this.loadAnimations();
        } else {
            this.el.style.visibility = "hidden";
        }
        //}
    }

    loadAnimations() {
        this.animation = lottieLight.loadAnimation({
            container: this.$container,
            autoplay: false,
            loop: false,
            path: this.animationPath,
            rendererSettings: {
                preserveAspectRatio: 'xMidYMid slice'
            }
        })

        this.animation.addEventListener('data_ready', this.onAnimationLoadedBind)
        this.animation.addEventListener('enterFrame', this.onAnimationProgressBind)
        this.animation.addEventListener('complete', this.onAnimationCompleteBind)
    }

    onAnimationLoaded() {
        this.el.style.visibility = "visible";
        this.isLoaded = true;
    }

    onAnimationComplete() {
        this.el.style.visibility = "hidden";

        //CookieManager.registerCookie(COOKIES_TYPE.SKIP_INTRO_COOKIE, true, COOKIES_TYPE_DURATION.SKIP_INTRO_COOKIE_DURATION)
    }

    onAnimationProgress(e) {
        if (!this.hasRevealPortal && e.currentTime >= 146) {
            this.hasRevealPortal = true
            this.call('revealExperience', null, 'Experiences')
        }
    }

    play() {
        if (this.isPlaying) return
        this.isPlaying = true
        gsap.ticker.add(this.onUpdateBind)
    }

    onUpdate() {
        if (!this.isLoaded) return
        this.isPlaying = false
        gsap.ticker.remove(this.onUpdateBind)

        this.animation.play()
    }
}