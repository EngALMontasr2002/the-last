import { createFocusTrap } from 'focus-trap';
import { module } from 'modujs';
import { html } from '../utils/environment';

/**
 * Generic component to display a modal.
 *
 * @property {string} activeClass - The CSS class name to apply to `<html>` to mark the modal as open.
 */
export default class extends module {
    /**
     * Creates a new Modal.
     *
     * @param  {object} options          - The module options.
     * @param  {string} options.name     - The module class name.
     * @param  {string} options.dataName - The module data attribute name.
     * @throws {TypeError} If the class does not have an active CSS class defined.
     */
    constructor(options) {
        super(options);


        this.moduleName = options.name;

        this.events = {
            click: {
                close: 'close',
            },
        };

        this.closeBind = (e) => {
            if (e.key === "Escape") {
                this.close();
            }
        }

        this.toggler = null;
        this.focusTrapOptions = {
            /**
             * There is a delay between when the class is applied
             * and when the element is focusable
             */
            checkCanFocusTrap: (trapContainers) => {
                const results = trapContainers.map((trapContainer) => {
                    return new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (getComputedStyle(trapContainer).visibility !== 'hidden') {
                                resolve();
                                clearInterval(interval);
                            }
                        }, 5);
                    });
                });

                // Return a promise that resolves when all the trap containers are able to receive focus
                return Promise.all(results);
            },

            onActivate: () => {
                html.classList.add(this.activeClass);
                this.el.setAttribute('aria-hidden', false)
            },

            onPostActivate: () => {
                if (this.toggler) {
                    this.toggler.setAttribute('aria-expanded', true);
                }
            },

            onDeactivate: () => {
                html.classList.remove(this.activeClass);
                this.el.setAttribute('aria-hidden', true)
            },

            onPostDeactivate: () => {
                if (this.toggler) {
                    this.toggler.setAttribute('aria-expanded', false);
                    this.toggler = null;
                }
            },
        };

        this.prevScrollTheme = ''
    }

    init() {
        if (typeof this.activeClass !== 'string' || !this.activeClass) {
            throw new TypeError(
                `${this.moduleName} expects a CSS class name for the 'activeClass' property`
            );
        }

        this.focusTrap = createFocusTrap(this.el, this.focusTrapOptions);

        document.addEventListener('keyup', this.closeBind)

        this.onInit ? .()
    }

    /**
     * @param {HTMLButtonElement} toggler - The toggle element.
     */
    toggle(toggler) {
        if (toggler) {
            this.toggler = toggler;
        }

        if (html.classList.contains(this.activeClass)) {
            this.close();
        } else {
            this.open();
        }
    }

    open(args) {
        this.focusTrap ? .activate ? .();

        this.onOpen ? .(args)

        this.prevScrollTheme = html.getAttribute('data-scroll-theme')
        html.setAttribute('data-scroll-theme', 'light')
    }

    close() {
        this.focusTrap ? .deactivate ? .();

        this.onClose ? .()

        if (html.getAttribute('data-scroll-theme-main') != 'light') {
            html.setAttribute('data-scroll-theme', this.prevScrollTheme)
        }
    }

    destroy() {
        this.focusTrap ? .deactivate ? .({
            returnFocus: false
        });

        document.removeEventListener('keyup', this.closeBind)

        this.onDestroy ? .()

        super.destroy();
    }
}