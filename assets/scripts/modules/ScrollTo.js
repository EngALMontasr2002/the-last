import { module } from 'modujs';
import { queryClosestParent } from '../utils/html';

export default class extends module {
    constructor(m) {
        super(m);

        this.$el = this.el
    }

    init() {
        this.bindEvents()
    }

    bindEvents() {
        this.onClickBind = this.onClick.bind(this);
        this.el.addEventListener('click', this.onClickBind)
    }

    unbindEvents() {
        this.el.removeEventListener('click', this.onClickBind)
    }

    onClick(event) {
        event.preventDefault();

        const target = this.el.getAttribute('href')
        const offset = this.getData('offset') || -40
        const next = this.getData('next')

        if (!target) {
            const $target = queryClosestParent(this.$el, next)
            if ($target) {
                const height = $target.getBoundingClientRect().bottom
                this.call('scrollTo', { target: height, offset: 0 }, 'Scroll')
                return
            }
        }

        const $targetAll = document.querySelectorAll(target)
        const $target = $targetAll[0]

        if (!$target) return

        this.call('scrollTo', { target: $target, offset: offset }, 'Scroll')
    }

    destroy() {
        super.destroy()
        this.unbindEvents()
    }
}