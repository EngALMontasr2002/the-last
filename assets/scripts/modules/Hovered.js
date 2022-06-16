import {  module } from 'modujs';
import { queryClosestParent } from '../utils/html';

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onEnterBind = this.onEnter.bind(this)
        this.onLeaveBind = this.onLeave.bind(this)

        // UI
        this.$el = this.el
        this.$parent = queryClosestParent(this.$el, '[data-hovered]')
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents();
    }

    destroy() {
        super.destroy();
        this.unbindEvents();
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        this.$el.addEventListener("mouseenter", this.onEnterBind);
        this.$el.addEventListener("mouseleave", this.onLeaveBind);
    }

    unbindEvents() {
        this.$el.removeEventListener("mouseenter", this.onEnterBind);
        this.$el.removeEventListener("mouseleave", this.onLeaveBind);
    }

    ///////////////
    // Callbacks
    ///////////////
    onEnter() {
        this.$parent.classList.add('is-hovered')
    }

    onLeave() {
        this.$parent.classList.remove('is-hovered')
    }
}