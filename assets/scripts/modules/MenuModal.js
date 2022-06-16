import { default as Modal } from './AbstractModal';

export default class extends Modal {
    /**
     * The CSS class name to apply to `<html>` to mark the modal as open.
     *
     * @var {string}
     */
    activeClass = 'has-menu-open'

    constructor(m) {
        super(m);

        // UI
        this.$anim = this.$('anim')[0]
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
    onInit() {

    }

    onDestroy() {

    }

    onClose() {
        this.el.classList.remove('is-show')
        this.$anim.classList.remove('is-active')
    }

    onOpen(args) {
        requestAnimationFrame(() => {
            this.el.classList.add('is-show')
            this.$anim.classList.add('is-active')
        })
    }

    ///////////////
    // Methods
    ///////////////
}