import { module } from 'modujs';
import { Swiper, Lazy, Navigation, Parallax } from 'swiper';

export default class extends module {
    constructor(m) {
        super(m);

        this.$container = this.$('container')[0]
    }

    init() {
        Swiper.use([Lazy, Navigation, Parallax]);

        this.carousel = new Swiper(this.$container, {
            spaceBetween: 20,
            grabCursor: true,
            parallax: true,
            speed: 750,
            threshold: 10,
            navigation: {
                prevEl: this.$('prev')[0],
                nextEl: this.$('next')[0]
            },
            lazy: {
                loadPrevNext: true,
                loadPrevNextAmount: 2
            },
            on: {
                lazyImageReady: (swiper, slideEl, imageEl) => {
                    imageEl.classList.add('is-loaded')
                    imageEl.parentNode.classList.add('is-loaded')
                },
                click: (swiper, event) => {
                    if (swiper.clickedIndex > swiper.activeIndex) swiper.slideNext()
                    else if (swiper.clickedIndex < swiper.activeIndex) swiper.slidePrev()
                        // let index = parseInt(swiper.clickedSlide.getAttribute('data-swiper-slide-index'))
                        // console.log(index);
                        // swiper.slideToLoop(index)
                }
            },
            breakpoints: {
                700: {
                    slidesPerView: 1,
                },
                1000: {
                    slidesPerView: 1.60,
                },
                1200: {
                    slidesPerView: 2,
                }
            }
        });
    }

    destroy() {
        super.destroy()

        if (this.carousel && this.carousel.destroy) {
            this.carousel.detachEvents()
            this.carousel.destroy()
        }
    }
}