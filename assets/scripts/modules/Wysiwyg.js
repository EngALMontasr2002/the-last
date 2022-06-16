import { module } from 'modujs';

export default class extends module {

    constructor(m) {
        super(m);

        // UI
        this.$el = this.el
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.removeMarginOfFirstItem()
    }

    destroy() {
        super.destroy();
    }

    ///////////////
    // Methods
    ///////////////
    removeMarginOfFirstItem() {
        const $wysiwygContainer = this.$('content')[0]
        if ($wysiwygContainer) {
            if ($wysiwygContainer.children.length) {
                const $firstElement = $wysiwygContainer.children[0]
                $firstElement.classList.add('c-wysiwyg-first-element')
                this.call('update', null, 'Scroll')
            }
        }
    }
}