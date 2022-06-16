/* eslint-disable */
// https://github.com/kaimallea/isMobile#browser
export default function isMobile() {
    var a = {};
    var f = /iPhone/i,
        h = /iPod/i,
        i = /iPad/i,
        r = /\biOS-universal(?:.+)Mac\b/i,
        g = /\bAndroid(?:.+)Mobile\b/i,
        j = /Android/i,
        c = /(?:SD4930UR|\bSilk(?:.+)Mobile\b)/i,
        d = /Silk/i,
        b = /Windows Phone/i,
        k = /\bWindows(?:.+)ARM\b/i,
        m = /BlackBerry/i,
        n = /BB10/i,
        o = /Opera Mini/i,
        p = /\b(CriOS|Chrome)(?:.+)Mobile/i,
        q = /Mobile(?:.+)Firefox\b/i;

    function s(l) {
        return function($) {
            return $.test(l)
        }
    }

    function e(l) {
        var $ = (l = l || ("undefined" != typeof navigator ? navigator.userAgent : "")).split("[FBAN");
        void 0 !== $[1] && (l = $[0]), void 0 !== ($ = l.split("Twitter"))[1] && (l = $[0]);
        var a = s(l),
            e = {
                apple: {
                    phone: a(f) && !a(b),
                    ipod: a(h),
                    tablet: !a(f) && a(i) && !a(b),
                    universal: a(r),
                    device: (a(f) || a(h) || a(i)) && !a(b)
                },
                amazon: {
                    phone: a(c),
                    tablet: !a(c) && a(d),
                    device: a(c) || a(d)
                },
                android: {
                    phone: !a(b) && a(c) || !a(b) && a(g),
                    tablet: !a(b) && !a(c) && !a(g) && (a(d) || a(j)),
                    device: !a(b) && (a(c) || a(d) || a(g) || a(j)) || a(/\bokhttp\b/i)
                },
                windows: {
                    phone: a(b),
                    tablet: a(k),
                    device: a(b) || a(k)
                },
                other: {
                    blackberry: a(m),
                    blackberry10: a(n),
                    opera: a(o),
                    firefox: a(q),
                    chrome: a(p),
                    device: a(m) || a(n) || a(o) || a(q) || a(p)
                },
                any: !1,
                phone: !1,
                tablet: !1
            };
        return e.any = e.apple.universal || e.apple.device || e.android.device || e.windows.device || e.other.device, e.phone = e.apple.phone || e.android.phone || e.windows.phone, e.tablet = e.apple.tablet || e.android.tablet || e.windows.tablet, e
    }
    a = e();
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = a
    } else if (typeof define === "function" && define.amd) {
        define(function() {
            return a
        })
    } else {
        return a
    }
};