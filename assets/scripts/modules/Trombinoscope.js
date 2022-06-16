import gsap, { mapRange, random, shuffle } from 'gsap/all';
import { module } from 'modujs'
import { loadImage } from '../utils/image';

const MAX_SLOT_COUNT = 7;
const MAIN_CHARACTERS_COUNT = 2;
const DEBUG_DATA = false;
const SHAPES = ['-circle', '-square', '-portal'];
export default class extends module {
    constructor(m) {
        super(m)

        // Binding
        this.onUpdateBind = this.onUpdate.bind(this)
        this.onClickBind = this.onClick.bind(this)

        // UI
        this.$el = this.el
        this.$slots = this.$('slot')
        this.$tiles = this.$('tile')
        this.$buttons = this.$('button');

        // Data
        const data = this.getData('data')

        if (!data) return

        this.formatedData = JSON.parse(data)
        this.charactersData = this.formatedData.filter(data => !data.main)
        this.mainCharactersData = this.formatedData.filter(data => data.main)

        // Count if main character length > MAIN_CHARACTERS_COUNT
        this.countMain = this.mainCharactersData.length > MAIN_CHARACTERS_COUNT ? MAIN_CHARACTERS_COUNT : this.mainCharactersData.length
        this.count = MAX_SLOT_COUNT - this.countMain

        this.data = []

        // Events
        this.events = {
            click: {
                refresh: 'onRefresh'
            }
        }

        // Shape data
        this.shapesData = {
            isStarted: false,
            lastTileIndex: 0,
            baseTime: Date.now(),
            maxInterval: 1000,
            maxDuration: 50,
            interval: 0
        }

        // Flag
        this.isRafPlaying = false
    }

    ///////////////
    // Lifecyle
    ///////////////
    init() {

        this.bindEvents()

        ///////////////
        // Shapes
        this.initShapes()

        ///////////////
        // Data
        if (!this.formatedData) return

        this.initFirstData()
        this.loadData().then(() => {
            this.populate()

            requestAnimationFrame(() => {
                this.show()
            })
        })


        this.play()
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
            $button.addEventListener("click", this.onClickBind)
        }
    }

    unbindEvents() {
        for (let index = 0; index < this.$buttons.length; index++) {
            const $button = this.$buttons[index];
            $button.removeEventListener("click", this.onClickBind)
        }
    }

    ///////////////
    // Callbacks
    ///////////////
    onClick(e) {
        const $buttons = [...this.$buttons]
        const index = $buttons.indexOf(e.target)
        this.call('open', this.data[index], 'TrombinoscopeModal')
    }

    onRefresh() {
        let isImagesHidden = false;
        let isNewDataLoaded = false;

        const refresh = () => {
            this.populate()

            requestAnimationFrame(() => {
                this.show()
            })
        }

        // Hide
        this.hide(() => {
            isImagesHidden = true

            if (isImagesHidden && isNewDataLoaded) {
                refresh()
            }
        })

        // New data
        this.refreshData()

        // Load data
        this.loadData().then(() => {
            isNewDataLoaded = true

            if (isImagesHidden && isNewDataLoaded) {
                refresh()
            }
        })
    }

    ///////////////
    // RAF
    ///////////////
    play() {
        if (this.isRafPlaying) return

        this.isRafPlaying = true

        gsap.ticker.add(this.onUpdateBind)
    }

    pause() {
        if (!this.isRafPlaying) return

        this.isRafPlaying = false

        gsap.ticker.remove(this.onUpdateBind)
    }

    onUpdate(time, deltaTime, frame) {
        this.updateShapes()
    }

    ///////////////
    // Data
    ///////////////
    initFirstData() {
        // Random
        const shuffleData = shuffle(this.charactersData)
        this.dataLog("INIT: shuffle other", shuffleData)

        const shuffleMainCharData = shuffle(this.mainCharactersData)
        this.dataLog("INIT: shuffle main", shuffleMainCharData)

        // Slice
        const selectedData = [...shuffleData].slice(0, this.count);
        this.selectedData = [...selectedData]
        this.dataLog("INIT: selected other", selectedData)

        const selectedMainCharData = [...shuffleMainCharData].slice(0, this.countMain);
        this.selectedMainCharData = [...selectedMainCharData]
        this.dataLog("INIT: selected main", selectedMainCharData)

        // If there is no enough data
        do {
            this.data.push(...selectedData)
        } while (this.data.length < this.count);

        // Then slice again because do while
        this.data = this.data.slice(0, this.count);

        // If there is no enough main data
        do {
            this.data.push(...selectedMainCharData)
        } while (this.data.length < this.countMain);

        // Then slice again because do while
        const data = this.data.slice(0, this.count + this.countMain);

        // Randomise again
        this.data = shuffle([...shuffle([...data])])

        // DEBUG
        if (DEBUG_DATA) {
            const debugData = [...this.data]
            this.dataLog("INIT: data", debugData)
        }
    }

    refreshData() {
        // Clear data
        this.data = []

        // Select priority data
        const priorityData = this.charactersData.filter(({ name: name1 }) => !this.selectedData.some(({ name: name2 }) => name2 === name1));
        this.dataLog("REFRESH: priority other", priorityData)

        const priorityMainCharData = this.mainCharactersData.filter(({ name: name1 }) => !this.selectedMainCharData.some(({ name: name2 }) => name2 === name1));
        this.dataLog("REFRESH: priority main", priorityMainCharData)

        const shuffleData = shuffle([...this.selectedData])
        this.dataLog("REFRESH: suffle", shuffleData)

        const shuffleMainCharData = shuffle([...this.selectedMainCharData])
        this.dataLog("REFRESH: suffle", shuffleMainCharData)

        // Add priority
        shuffleData.unshift(...shuffle([...priorityData]))
        this.dataLog("REFRESH: add prioriy", shuffleData)

        shuffleMainCharData.unshift(...shuffle([...priorityMainCharData]))
        this.dataLog("REFRESH: add prioriy", shuffleMainCharData)

        // Slice
        const selectedData = [...shuffleData].slice(0, this.count);
        this.selectedData = [...selectedData]
        this.dataLog("REFRESH: selected", selectedData)

        const selectedMainCharData = [...shuffleMainCharData].slice(0, this.countMain);
        this.selectedMainCharData = [...selectedMainCharData]
        this.dataLog("REFRESH: selected main", selectedMainCharData)

        // If there is no enough data
        do {
            this.data.push(...this.selectedData)
        } while (this.data.length < this.count);

        // Then slice again because do while
        this.data = this.data.slice(0, this.count);

        // If there is no enough main data
        do {
            this.data.push(...selectedMainCharData)
        } while (this.data.length < this.countMain);

        // Then slice again because do while
        const data = this.data.slice(0, this.count + this.countMain);

        // Randomise again
        this.data = shuffle([...shuffle([...data])])

        // DEBUG
        if (DEBUG_DATA) {
            const debugData = [...this.data]
            this.dataLog("REFRESH: data", debugData)
        }
    }

    loadData() {
        const promises = []

        let index = 0
        while (index < this.data.length) {
            const dataObj = this.data[index]
            if (dataObj ? .thumbnail) {
                const promise = loadImage(dataObj.thumbnail).then((imageObj) => {
                    dataObj.loadedImage = imageObj
                })
                promises.push(promise)
            } else {
                dataObj.loadedImage = null
            }
            index++
        }

        return Promise.all([...promises])
    }

    populate() {
        const template = (src = '', caption = '') => `
            <figure class="c-figure">
                <div class="c-figure_inner">
                    <img
                        class="c-figure_image || js-image"
                        style="opacity: 0; visibility: hidden; transform: scale(1.1)"
                        src="${src}"
                        alt="${caption}"
                    >
                </div>
                <figcaption class="u-screen-reader-text">${caption}</figcaption>
            </figure>
        `

        let slotIndex = 0
        while (slotIndex < this.data.length) {

            const $slot = this.$slots[slotIndex]
            const data = this.data[slotIndex]

            if ($slot && data ? .loadedImage ? .url) {
                $slot.innerHTML = template(data.loadedImage.url, data ? .name)
            } else if ($slot) {
                $slot.innerHTML = ''
            }

            slotIndex++
        }
    }

    ///////////////
    // Shapes
    ///////////////
    initShapes() {
        let tileIndex = 0;

        while (tileIndex < this.$tiles.length) {
            const $tile = this.$tiles[tileIndex]
            const shapeClass = random(SHAPES)
            $tile.classList.add(shapeClass)
            tileIndex++
        }
    }

    updateShapes() {
        if (!this.shapesData.isStarted) {
            this.shapesData.baseTime = Date.now()
            this.shapesData.isStarted = true
            this.shapesData.interval = random(0, this.shapesData.maxInterval, 1)
        }

        const intervalDuration = this.shapesData.interval
        const intervalDateNow = Date.now()
        const intervalElapsed = intervalDateNow - this.shapesData.baseTime
        const intervalProgress = Math.min(intervalElapsed / intervalDuration, 1)

        // each interval
        if (intervalProgress >= 1) {

            this.shapesData.baseTime = Date.now()
            this.shapesData.interval = random(0, this.shapesData.maxInterval, 1)

            this.updateRandomShape()
        }
    }

    updateRandomShape() {

        // Select random tile index
        let randomTileIndex = 0

        do { // Avoid last tile index
            randomTileIndex = Math.abs(random(0, this.$tiles.length - 1, 1))
        } while (randomTileIndex === this.shapesData.lastTileIndex);

        this.shapesData.lastTileIndex = randomTileIndex

        const $randomTile = this.$tiles[randomTileIndex]


        // Select random shape
        const randomShapeIndex = Math.abs(random(0, SHAPES.length - 1, 1))
        const randomShape = SHAPES[randomShapeIndex]

        // Then apply shape to the tile
        if (!$randomTile) return

        // Remove prev shape class
        let shapeClassIndex = 0
        while (shapeClassIndex < SHAPES.length) {
            const shapeClass = SHAPES[shapeClassIndex]
            $randomTile.classList.remove(shapeClass)
            shapeClassIndex++
        }

        // Add new shape class
        $randomTile.classList.add(randomShape)
    }

    ///////////////
    // Animations
    ///////////////
    hide(onComplete = () => {}) {
        const $images = this.$el.querySelectorAll('.js-image')

        gsap.to($images, {
            autoAlpha: 0,
            duration: .3,
            ease: 'power2.out',
            onComplete: onComplete
        })
    }

    show() {
        const $images = this.$el.querySelectorAll('.js-image')

        gsap.to($images, {
            autoAlpha: 1,
            scale: 1,
            duration: 1,
            ease: 'power2.out',
            stagger: .1
        })
    }


    ///////////////
    // Debug
    ///////////////
    dataLog(name, message) {
        if (DEBUG_DATA) {
            console.log(name, message)
        }
    }
}