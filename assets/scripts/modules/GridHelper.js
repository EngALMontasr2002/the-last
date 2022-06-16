import { module } from "modujs";
import { html } from "../utils/environment";

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onKeyupBind = (e) => {
            if (e.key === "g") this.toggle()
        };

        // UI
        this.$el = this.el;
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
        document.addEventListener('keyup', this.onKeyupBind)
    }

    unbindEvents() {
        document.removeEventListener('keyup', this.onKeyupBind)
    }

    ///////////////
    // Display
    ///////////////
    toggle() {
        if (html.classList.contains("has-grid-opened")) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        html.classList.add("has-grid-opened");
    }

    close() {
        html.classList.remove("has-grid-opened");
    }
}