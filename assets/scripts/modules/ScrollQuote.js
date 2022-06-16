import { module } from 'modujs';
import { clamp, map } from '../utils/maths';

const CLASS = {
    ACTIVE: 'is-active',
    WORD: 'c-scroll-quote_word'
}

export default class extends module {
    constructor(m) {
        super(m);

        // UI
        this.$el = this.el
        this.$text = this.$('text')[0]
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.split()
    }

    destroy() {
        super.destroy()
    }

    ///////////////
    // Callbacks
    ///////////////
    onProgress(scrollProgress) {
        const progress = Math.round((this.computeProgressData(scrollProgress) + Number.EPSILON) * 10) / 10
        this.computeActiveWord(progress)
    }

    ///////////////
    // Methods
    ///////////////
    computeProgressData(scrollProgress) {
        return clamp(map(scrollProgress, 0, 1, 0, this.$words.length + 1), 0, this.$words.length + 1)
    }

    split() {
        const regex = /(^|<\/?[^>]+>|\s+)([^\s<]+)/g
        this.$text.innerHTML = this.$text.innerHTML.replace(regex, '$1<span class="' + CLASS.WORD + '">$2</span>')
        this.$words = this.$text.querySelectorAll('.' + CLASS.WORD)
    }

    computeActiveWord(progress) {
        for (let i = 0; i < this.$words.length; i++) {
            if (progress > i + 1 && !this.$words[i].classList.contains(CLASS.ACTIVE)) {
                this.$words[i].classList.add(CLASS.ACTIVE)
            } else if (progress <= i + 1 && this.$words[i].classList.contains(CLASS.ACTIVE)) {
                this.$words[i].classList.remove(CLASS.ACTIVE)
            }
        }
    }

}