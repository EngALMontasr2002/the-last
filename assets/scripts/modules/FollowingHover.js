import { module } from 'modujs';

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onEnterBind = this.onEnter.bind(this);
        this.onLeaveBind = this.onLeave.bind(this);
        this.onListEnterBind = this.onListEnter.bind(this);
        this.onListLeaveBind = this.onListLeave.bind(this);
        this.onResizeBind = this.onResize.bind(this)
        this.onFontsLoadedBind = this.onFontsLoaded.bind(this)

        // UI
        this.$el = this.el
        this.$items = this.$("item");
        this.$indicator = this.$("indicator")[0];

        // Values
        this.metrics = [];
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        // Set metrics
        this.setMetrics();

        // Set default values
        this.currentIndex = 0
        this.setDefaultValues(this.currentIndex);

        // Bind events
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
        this.$el.addEventListener("mouseenter", this.onListEnterBind);
        this.$el.addEventListener("mouseleave", this.onListLeaveBind);

        this.$items.forEach(($item) => {
            $item.addEventListener("mouseenter", this.onEnterBind);
            $item.addEventListener("mouseleave", this.onLeaveBind);
        });

        window.addEventListener("resizeEnd", this.onResizeBind);
        window.addEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    unbindEvents() {
        this.$el.removeEventListener("mouseenter", this.onListEnterBind);
        this.$el.removeEventListener("mouseleave", this.onListLeaveBind);

        this.$items.forEach(($item) => {
            $item.removeEventListener("mouseenter", this.onEnterBind);
            $item.removeEventListener("mouseleave", this.onLeaveBind);
        });
        window.removeEventListener("resizeEnd", this.onResizeBind);
        window.removeEventListener("fontsLoaded", this.onFontsLoadedBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onEnter(e) {
        const $target = e.currentTarget;
        this.currentIndex = Array.from(this.$items).indexOf($target);

        this.setIndicatorTranslate(this.currentIndex);
        this.setActiveClass(this.currentIndex)
    }

    onLeave() {}

    onListEnter() {
        this.setIndicatorVisibility(true);
    }

    onListLeave() {
        this.setIndicatorVisibility(false);
    }

    onResize() {
        this.setMetrics();
        this.setDefaultValues(this.currentIndex);
    }

    onFontsLoaded() {
        this.setMetrics();
        this.setDefaultValues(this.currentIndex);
    }

    ///////////////
    // Methods
    ///////////////
    setMetrics() {
        this.metrics = [];

        this.$items.forEach(($item) => {
            this.metrics.push($item.offsetHeight);
        });
    }

    setDefaultValues(index) {
        this.setActiveClass(index);
        this.setIndicatorTranslate(index);
        this.setIndicatorHeight(index);
    }

    setActiveClass(activeIndex) {
        this.$items.forEach(($item, itemIndex) => {
            if (itemIndex === activeIndex) {
                $item.classList.add('is-active')
            } else {
                $item.classList.remove('is-active')
            }
        });
    }

    setIndicatorHeight(index) {
        const height = this.metrics[index]
        this.$indicator.style.height = `${height}px`
    }

    setIndicatorTranslate(index) {
        if (index < 0) return
        const metrics = [...this.metrics];
        metrics.length = index;
        const translateY = metrics.reduce((a, b) => a + b, 0);
        this.$indicator.style.transform = `translate3d(0, ${translateY}px, 0)`
    }

    setIndicatorVisibility(isVisible) {
        if (isVisible) {
            this.$indicator.classList.add('is-active')
        } else {
            this.$indicator.classList.remove('is-active')
        }
    }

    resetItems(items) {
        this.unbindEvents();

        this.$items = items;

        requestAnimationFrame(() => {
            this.init()
        })
    }
}