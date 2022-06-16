import modular from 'modujs';

import globals from './globals';
import * as modules from './modules';

import { html } from "./utils/environment";
import { fontsLoader } from './utils/fontsLoader';
import { preloadImages } from "./utils/image";
import { styleSheetsLoader } from './utils/styleSheetsLoader';
import debounce from "./utils/debounce";
import isMobile from "./utils/isMobile";

// Get is mobile state
const isMobileObj = isMobile()
const IS_TOUCH_DEVICE = isMobileObj ? .phone || isMobileObj ? .tablet

////////////////
// Settings
////////////////
const fonts = [
    { name: "Lexend", style: 'normal', weight: '300' },
    { name: "Lexend", style: 'normal', weight: '400' },
    { name: "Lexend", style: 'normal', weight: '500' },
    { name: "Libre Caslon Text", style: 'normal', weight: 'normal' },
    { name: "Libre Caslon Text", style: 'italic', weight: 'normal' },
]

const app = new modular({
    modules: modules
});


////////////////
// Hooks
////////////////
const onFontsLoaded = () => {
    html.classList.add("is-fonts-loaded");
}

const onImagesPreloaded = () => {
    html.classList.add("is-images-preloaded");
}

const onAllAssetsLoaded = () => {
    setTimeout(() => {
        html.classList.add('is-loaded');
        html.classList.add('is-first-loaded');
        html.classList.remove('is-loading');

        setTimeout(() => {
            html.classList.add('is-ready');
        }, 100);

    }, 400);
}

////////////////
// Init
////////////////
function init() {
    // current template
    window.currentTemplate = html.dataset ? .template

    // Load fonts
    window.isFontsLoaded = false;

    let fontsPromise = new Promise((resolve) => {
        fontsLoader(fonts,
            () => {
                // Callback
                onFontsLoaded ? .()
                    // Update modules
                requestAnimationFrame(() => {
                        const fontsLoadedEvent = new CustomEvent("fontsLoaded");
                        window.dispatchEvent(fontsLoadedEvent);
                        window.isFontsLoaded = true;
                    })
                    // Resolve
                resolve()
            }
        );
    })

    // Images
    let imagesPromise = new Promise((resolve) => {
        preloadImages(() => {
            // Callback
            onImagesPreloaded ? .()
                // Resolve
            resolve()
        })
    })

    // When all assets are ready
    Promise.all([fontsPromise, imagesPromise]).then(() => {
        // Callback
        onAllAssetsLoaded ? .()
    })

    // Bind global events
    bindEvents();

    // Check mobile state
    if (IS_TOUCH_DEVICE) {
        html.classList.add('is-touchable')
    }

    // Need to play experience introduction
    window.needIntro = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // First resize
    onResize();
    document.documentElement.style.setProperty("--vh-initial", `${document.documentElement.clientHeight * 0.01}px`);

    // Globals
    globals();

    // Init modules
    app.init(app);

    // Debug focus
    // document.addEventListener('focusin', function() {
    //     console.log('focused: ', document.activeElement)
    // }, true);
}

////////////////
// Global events
////////////////
function bindEvents() {
    // Resize event
    const resizeEndEvent = new CustomEvent("resizeEnd");
    window.addEventListener("resize", debounce(
        () => {
            onResize();
            window.dispatchEvent(resizeEndEvent);
        }, 200, false));
}

function onResize() {
    let vw = html.offsetWidth * 0.01;
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vw", `${vw}px`);
    document.documentElement.style.setProperty("--vh", `${vh}px`);
}

////////////////
// Execute
////////////////
window.onload = (event) => {
    html.classList.remove("no-js");

    const $style = document.getElementById("main-css");

    if ($style) {
        styleSheetsLoader([$style], () => {
            init()
        })
    } else {
        console.warn('The "main-css" stylesheet not found');
    }
};