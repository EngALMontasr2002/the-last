import { default as Modal } from './AbstractModal';

export default class extends Modal {
    /**
     * The CSS class name to apply to `<html>` to mark the modal as open.
     *
     * @var {string}
     */
    activeClass = 'has-video-open'

    constructor(m) {
        super(m);

        // UI
        this.inner = this.$('inner')[0]
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {}

    unbindEvents() {}

    ///////////////
    // Callbacks
    ///////////////
    onInit() {}

    onDestroy() {}

    onClose() {
        this.closeVideo()
    }

    onOpen(args) {
        this.openVideo(args)
    }

    ///////////////
    // Methods
    ///////////////
    openVideo(args) {
        if (this.emptyTimeout) clearTimeout(this.emptyTimeout)

        this.appendDelay = setTimeout(() => {
            switch (args.host) {
                case 'youtube':
                    this.inner.innerHTML = `<iframe src="https://www.youtube.com/embed/${args.id}?&autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`
                    break;
                case 'vimeo':
                    this.inner.innerHTML = `<iframe src="https://player.vimeo.com/video/${args.id}?autoplay=1&loop=1&autopause=0" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`
                    break;
                case 'mp4':
                    this.inner.innerHTML = `<video src="${args.id}" autoplay controls></video>`
                    break;
                default:
                    break;
            }
        }, 500)
        this.el.classList.add('is-active')
    }

    closeVideo() {
        clearTimeout(this.appendDelay)

        this.el.classList.remove('is-active')
        this.emptyTimeout = setTimeout(() => {
            this.inner.innerHTML = ''
        }, 250)
    }

}