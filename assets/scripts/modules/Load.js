import { module } from 'modujs';
import modularLoad from 'modularload';
import { CookieManager, COOKIES_TYPE, COOKIES_TYPE_DURATION } from '../classes/Cookies/CookieManager';
import { html } from "../utils/environment";

export default class extends module {
    constructor(m) {
        super(m);
    }

    init() {
        const load = new modularLoad({
            enterDelay: 500,
            transitions: {
                customTransition: {}
            }
        });

        load.on('loading', (transition, oldContainer) => {
            // Destroy cursor
            this.call('destroyCursor', null, 'Cursor')

            // Close modals
            requestAnimationFrame(() => {
                this.call('close', null, 'MenuModal');
                this.call('close', null, 'TrombinoscopeModal');
                this.call('close', null, 'VideoModal');
            })

            // Doesn't need anymore to play experience introduction
            if (!CookieManager.checkCookie(COOKIES_TYPE.SKIP_INTRO_COOKIE)) {
                CookieManager.registerCookie(COOKIES_TYPE.SKIP_INTRO_COOKIE, true, COOKIES_TYPE_DURATION.SKIP_INTRO_COOKIE_DURATION)
            }
        });

        load.on('loaded', (transition, oldContainer, newContainer) => {
            this.call('destroy', oldContainer, 'app');
            this.call('update', newContainer, 'app');

            // Init cursor
            this.call('initCursor', null, 'Cursor')

            // If exit home
            if (window.currentTemplate === 'home') {
                html.classList.remove("has-intro-revealed");
                html.classList.remove("has-experience-revealed");
            }

            html.classList.add('has-changed-page');

            // Set initial scroll theme
            html.setAttribute('data-scroll-theme', html.getAttribute('data-scroll-theme-main'));

            // current template
            window.currentTemplate = html.dataset ? .template

            // first loading
            window.isNotFirstLoading = true
        });
    }
}