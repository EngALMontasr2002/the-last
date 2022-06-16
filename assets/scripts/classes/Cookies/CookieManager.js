'use strict'

export const COOKIES_TYPE = {
    GDPR_COOKIE: 'accept_cookies',
    SKIP_INTRO_COOKIE: 'skip_intro_cookie'
}

export const COOKIES_TYPE_DURATION = {
    GDPR_COOKIE_DURATION: 129600, //minutes = 90 days
    SKIP_INTRO_COOKIE_DURATION: 4320 //minutes = 3 days
}

class $CookieManager {
    duration = COOKIES_TYPE_DURATION.GDPR_COOKIE_DURATION

    // Methods
    registerCookie(name, value, duration) {

        // Name
        if (!name) {
            return
        }

        // Value
        if (!value) {
            value = true
        }

        // Duration
        let initialDuration = this.duration
        if (duration) {
            initialDuration = duration
        }

        const endDate = new Date();
        endDate.setTime(endDate.getTime() + (initialDuration * 60 * 1000))

        const cookie = {
            name,
            endDate,
            value
        }

        const expires = "expires=" + cookie.endDate.toUTCString()
        document.cookie = cookie.name + "=" + cookie.value + ";" + expires + ";path=/"
    }

    unregisterCookie(name) {
        if (!name) {
            return
        }

        const date = new Date()
        date.setTime(date.getTime() - (1000 * 60 * 60 * 24))

        const expires = "expires=" + date.toUTCString()
        document.cookie = name + "=" + "; " + expires
    }

    getCookie(name) {
        if (!name) {
            return
        }

        const cookieName = name + "="
        const wCookieArr = document.cookie.split(';')

        for (let i = 0; i < wCookieArr.length; i++) {
            let cookie = wCookieArr[i];
            while (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1)
            }
            if (cookie.indexOf(cookieName) == 0) {
                return cookie.substring(cookieName.length, cookie.length)
            }
        }

        return "";
    }

    checkCookie(name) {
        const cookie_exists = this.getCookie(name)
        return cookie_exists
    }

    // GDPR Cookies
    acceptedCookies = false

    hasAcceptedCookies() {
        if (this.acceptedCookies) {
            return true
        } else if (this.getCookie(COOKIES_TYPE.GDPR_COOKIE)) {
            this.acceptedCookies = true
            return true
        }
        return false
    }

    acceptCookies() {
        this.registerCookie(COOKIES_TYPE.GDPR_COOKIE, true)
        this.acceptedCookies = true
    }
}

export const CookieManager = new $CookieManager