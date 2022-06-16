import gsap from 'gsap/all'
import { module } from 'modujs'

const MAX_ITEMS_TO_SHOW = 6

export default class extends module {
    constructor(m) {
        super(m)

        // UI
        this.$el = this.el
        this.$buttons = this.$('button')
        this.$items = this.$('item')
        this.$loadmore = this.$('loadmore')[0]
        this.$loadmoreContainer = this.$('loadmoreContainer')[0]

        // Data
        this.filterActive = "all"
        this.selectedItems = []
        this.ignoredItems = []
        this.foldItems = []
        this.moreItems = []
        this.isLoading = false

        // Bind
        this.onClickBind = this.onClick.bind(this)
        this.onResizeBind = this.onResize.bind(this)
        this.onLoadBind = this.onLoad.bind(this)
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {
        this.bindEvents()

        const $activeButton = this.$('button')[0]
        $activeButton ? .classList.add('is-active')

        this.filterJob()
    }

    destroy() {
        super.destroy()
        this.unbindEvents()
    }

    ///////////////
    // Events
    ///////////////
    bindEvents() {
        for (let index = 0; index < this.$buttons.length; index++) {
            const $button = this.$buttons[index];
            $button.addEventListener('click', this.onClickBind)
        }

        this.$loadmore ? .addEventListener('click', this.onLoadBind)

        window.addEventListener('resize', this.onResizeBind)
    }

    unbindEvents() {
        for (let index = 0; index < this.$buttons.length; index++) {
            const $button = this.$buttons[index];
            $button.removeEventListener('click', this.onClickBind)
        }

        this.$loadmore ? .removeEventListener('click', this.onLoadBind)

        window.removeEventListener('resize', this.onResizeBind)
    }

    ///////////////
    // Callbacks
    ///////////////
    onClick(e) {
        if (this.isLoading) return

        const $target = e.target
        this.filterActive = e.target.dataset.id

        for (let index = 0; index < this.$buttons.length; index++) {
            const $button = this.$buttons[index]

            if ($button === $target) {
                $button.classList.add('is-active')
            } else {
                $button.classList.remove('is-active')
            }
        }

        this.filterJob()
    }

    onResize() {}

    onLoad() {
        if (this.$loadmoreContainer) {
            gsap.to(this.$loadmoreContainer, {
                duration: .6,
                autoAlpha: 0,
                onComplete: () => {
                    this.$loadmoreContainer.style.display = "none";

                    this.$moreItems.forEach(($item) => {
                        $item.classList.remove('is-hidden');
                        $item.setAttribute('aria-hidden', true)
                    })

                    this.call('resetItems', this.$selectedItems, 'FollowingHover')
                    this.call('update', null, 'Scroll')
                }
            })
        }
    }

    ///////////////
    // Methods
    ///////////////
    filterJob() {
        this.$selectedItems = []
        this.$ignoredItems = []

        for (let index = 0; index < this.$items.length; index++) {
            const $item = this.$items[index];
            const itemFilters = $item.dataset.ids
            const filters = itemFilters.split(',')

            if (this.filterActive === 'all') {
                this.$selectedItems.push($item)
            } else if (filters.indexOf(this.filterActive) > -1) {
                this.$selectedItems.push($item)
            } else {
                this.$ignoredItems.push($item)
            }
        }

        this.updateList()

        if (this.$selectedItems.length > MAX_ITEMS_TO_SHOW) {

            if (this.$loadmoreContainer) {
                this.$loadmoreContainer.style.display = "";
                gsap.to(this.$loadmoreContainer, {
                    duration: .6,
                    autoAlpha: 1,
                    delay: 1
                })
            }

        } else {
            if (this.$loadmoreContainer) {
                gsap.to(this.$loadmoreContainer, {
                    duration: .6,
                    autoAlpha: 0,
                    onComplete: () => {
                        this.$loadmoreContainer.style.display = "none";
                    }
                })
            }
        }
    }

    updateList() {
        this.isLoading = true
        this.$el.classList.add('is-loading')

        gsap.delayedCall(1, () => {
            this.$foldItems = this.$selectedItems.slice(0, MAX_ITEMS_TO_SHOW)
            this.$moreItems = this.$selectedItems.slice(MAX_ITEMS_TO_SHOW, this.$selectedItems.length)

            this.$ignoredItems.forEach(($item) => {
                $item.classList.add('is-hidden');
                $item.setAttribute('aria-hidden', true)
            })

            this.$foldItems.forEach(($item, index) => {
                $item.classList.remove('is-hidden');
                $item.style.setProperty("--nth-child", index)
                $item.setAttribute('aria-hidden', false)
            })

            this.$moreItems.forEach(($item, index) => {
                $item.style.setProperty("--nth-child", index)
                $item.setAttribute('aria-hidden', false)

                requestAnimationFrame(() => {
                    $item.classList.add('is-hidden');
                })
            })

            this.call('resetItems', this.$selectedItems, 'FollowingHover')

            this.$el.classList.remove('is-loading')
            this.isLoading = false

            requestAnimationFrame(() => {
                this.call('update', null, 'Scroll')
            })
        })
    }
}