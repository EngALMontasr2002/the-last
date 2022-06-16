import gsap from "gsap/all"
import isMobile from "../../utils/isMobile"

// Get is mobile state
const isMobileObj = isMobile()
const IS_TOUCH_DEVICE = isMobileObj ? .phone || isMobileObj ? .tablet

///////////////
// Data
///////////////
let translate = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    smoothX: window.innerWidth * 0.5,
    smoothY: window.innerHeight * 0.5,
    lerp: 0.08,
}

let isPlaying = false

///////////////
// Events
///////////////
const bindEvents = () => {
    window.addEventListener("mousemove", onMouseMove)
}

///////////////
// Callback
///////////////
const onMouseMove = (e) => {
    translate.x = e.clientX
    translate.y = e.clientY

    // Save coords
    Mouse.x = translate.x
    Mouse.y = translate.y
}

const onUpdate = () => {
    translate.smoothX += (translate.x - translate.smoothX) * translate.lerp
    translate.smoothX = ((100 * (translate.smoothX + 0.01)) | 0) / 100

    translate.smoothY += (translate.y - translate.smoothY) * translate.lerp
    translate.smoothY = ((100 * (translate.smoothY + 0.01)) | 0) / 100

    // Save coords
    Mouse.smoothX = translate.smoothX
    Mouse.smoothY = translate.smoothY
}

///////////////
// Methods
///////////////


///////////////
// Static class
///////////////
class Mouse {

    ///////////////
    // Init
    ///////////////
    static {
        if (!IS_TOUCH_DEVICE) {
            bindEvents()
            Mouse.play()
        }
    }

    ///////////////
    // Properties
    ///////////////
    static x = translate.x
    static y = translate.y

    static smoothX = translate.smoothX
    static smoothY = translate.smoothY


    ///////////////
    // Methods
    ///////////////
    static play() {
        if (isPlaying) return
        isPlaying = true
        gsap.ticker.add(onUpdate)
    }

    static pause() {
        if (!isPlaying) return
        isPlaying = false
        gsap.ticker.remove(onUpdate)
    }
}

///////////////
// Export
///////////////
export default Mouse