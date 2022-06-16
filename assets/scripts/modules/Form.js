import { module } from 'modujs';
import { isEmail } from '../utils/is';
import { queryClosestParent } from '../utils/html'

const STATE = {
    IDLE: '-idle', // Form is ready
    PROCESSING: '-processing', // Form is being processed
    SENDING: '-sending', // Form is being sent and awaiting response
    INVALID: '-invalid', // Form is invalid (HTTP 400)
    ERRORED: '-errored', // Form can not be processed (HTTP 500)
    COMPLETED: '-completed', // Form was processed successfully (HTTP 201)
};

const GENERIC_MESSAGES = {
    CRITICAL: 'An error occured. Please try again later',
};

const SUCCESS_MESSAGE_DURATION = 2000

export default class extends module {
    constructor(m) {
        super(m);

        // Binding
        this.onHandleSubmitBind = this.onHandleSubmit.bind(this);

        // UI
        this.$el = this.el
        this.$submit = this.$('submit')[0];
        this.$form = this.$('form')[0];
        this.$error = this.$('error')[0];
        this.$success = this.$('success')[0];

        // // Recaptcha
        // this.sitekey = typeof window.app !== 'undefined' && window.app.hasOwnProperty('recaptchaPublicKey') ?
        //     window.app.recaptchaPublicKey :
        //     false;
        // this.useRecaptcha = this.getData('use-recaptcha') || false;
        // this.badgeContainerId = 'grecaptcha-container-id';
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
        this.$form.addEventListener('submit', this.onHandleSubmitBind);
    }

    unbindEvents() {
        this.$form.removeEventListener('submit', this.onHandleSubmitBind);
    }

    ///////////////
    // Callbacks
    ///////////////
    onHandleSubmit(event) {
        event.preventDefault();

        // Save submit event
        this.submitEvent = event;
        this.formData = this.getFormData(event.target);

        if (!this.validateForm()) {
            return false;
        }

        if (this.useRecaptcha && this.sitekey) {

            // if (!window.hasRenderedRecaptcha) {
            //     this.clientId = grecaptcha.render(this.badgeContainerId, {
            //         'sitekey': this.sitekey,
            //         'theme': 'dark',
            //         'size': 'invisible',
            //         'badge': 'inline',
            //     });
            //     window.hasRenderedRecaptcha = true
            // }

            // grecaptcha.ready(() => {
            //     grecaptcha.execute(this.clientId)
            //         .then(token => this.processForm(token));
            // });
        } else {
            this.processForm()
        }
    }

    validateForm() {
        let isValid = true;
        [...this.submitEvent.target.elements].forEach(el => {
            const elIsRequired = el.getAttribute('required');
            const elValue = this.formData.get(el.getAttribute('name'))
            const elType = el.getAttribute('type') || 'text'
            const $parentEl = queryClosestParent(el, '.c-form_item') || el

            // remove error message on validation
            if ($parentEl.classList.contains('has-error')) {
                $parentEl.classList.remove('has-error')
                $parentEl.querySelector('.c-form_error').ariaHidden = "true"
            }

            // check if required and empty value
            // or valid email
            if (elIsRequired === null ||
                (elType !== 'email' && elValue && elValue.length !== 0) ||
                (elType === 'email' && isEmail(elValue))
            ) {
                return;
            }

            isValid = false
            $parentEl.classList.add('has-error')
            $parentEl.querySelector('.c-form_error').ariaHidden = "false"

            requestAnimationFrame(() => {
                this.call('update', null, 'Scroll')
            })
        })
        return isValid
    }

    ///////////////
    // Methods
    ///////////////
    processForm(token) {
        // Check if form is busy
        if ([STATE.PROCESSING, STATE.SENDING].includes(this.formState)) {
            console.warn('Form is busy');
            return false;
        }

        if (token) {
            this.formData.append('g-recaptcha-response', token)
        }

        // From is processing
        this.setState(STATE.PROCESSING)

        // Clear error
        this.clearErrorMessage()

        // Suspend form
        // this.suspendForm();

        try {
            this.submitForm();
        } catch (error) {
            console.error('[App.Form.handleSubmit]', error);
            this.setState(STATE.ERRORED);
            this.setErrorMessage(GENERIC_MESSAGES.CRITICAL);
            // this.resumeForm();
        }

    }

    submitForm() {
        // Check if form is sending
        if (this.formState === STATE.SENDING) {
            console.warn('Form is already sending');
            return false;
        }

        // Check if I can access to the submit event
        if (!this.submitEvent) {
            throw new Error('Missing submit event object');
        }

        // Set state to sending
        this.setState(STATE.SENDING)

        // Prepare fetch
        const form = this.submitEvent.target;
        const formUrl = form.action;

        const controller = new AbortController();

        const badgeContainerId = this.badgeContainerId;

        // Start fetch
        fetch(formUrl, {
            method: form.method,
            body: this.formData,
            signal: controller.signal

        }).then(response => {
            return response.json();

        }).then(response => {
            // Success
            if (response && response.success) {
                controller.abort();
                this.setState(STATE.COMPLETED)
                this.$success.ariaHidden = "false"
                this.$form.reset()

                // Back to default
                setTimeout(() => {
                    this.setState(STATE.IDLE)
                    this.$success.ariaHidden = "true"
                }, SUCCESS_MESSAGE_DURATION)
            }

            // Errors
            if (response && response.errors != '') {
                this.serverErrorMessages = {...response.errors };
                this.serverErrors = response.errors;
                this.setState(STATE.ERRORED);
                this.setErrorMessage(GENERIC_MESSAGES.CRITICAL);
                this.$error.ariaHidden = "false"
            }

            // this.resumeForm();

        }).catch(error => {
            //console.error('[App.Form.submitForm]', error);
            this.setState(STATE.ERRORED)
            this.setErrorMessage(GENERIC_MESSAGES.CRITICAL);
            this.$error.ariaHidden = "false"
                // this.resumeForm();
        })
    }

    getFormData(form) {
        const submission = form.dataset.submission;
        const formData = new FormData(form);

        // Stringify and append to form data
        formData.append('submission', submission);

        return formData;
    }

    setState(stateValue) {
        const prevState = this.formState
        this.formState = stateValue
        this.$form.classList.remove(prevState)
        this.$form.classList.add(this.formState)

        if (stateValue === STATE.ERRORED || stateValue === STATE.COMPLETED) {
            requestAnimationFrame(() => {
                this.call('update', null, 'Scroll')
            })
        }
    }

    setErrorMessage(message) {
        if (this.$error) {
            this.$error.innerHTML = message
        } else {
            console.warn(message)
        }
    }

    clearErrorMessage() {
        if (this.$error) {
            this.$error.innerHTML = ''
            this.$error.ariaHidden = "true"
        }
    }

    suspendForm() {}

    resumeForm() {}
}