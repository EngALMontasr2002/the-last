export async function fontsLoader(fonts, callback) {
    const fontFaceObservers = [];

    if (!fonts.length) return;

    fonts.forEach((font) => {
        const observer = loadFont(font.name, font.style, font.weight);
        fontFaceObservers.push(observer);
    });

    try {
        await Promise.all(fontFaceObservers);
        callback ? .();
    } catch (err) {
        console.warn("Some critical font are not available:", err);
    }
}


export function loadFont(fontName, fontStyle, fontWeight) {
    return new Promise((resolve) => {

        let loop = null

        const clearLoop = () => {
            if (loop) {
                clearInterval(loop)
                loop = null
            }
        }

        const tryToLoadFont = () => {
            let hasLoaded = false;

            try {
                hasLoaded = document.fonts.check(`${fontStyle} ${fontWeight} 16px ${fontName}`)
            } catch (error) {
                console.info(`CSS font loading API error with ${fontName} ${fontStyle} ${fontWeight}`, error);
                clearLoop()
                resolve();
            }

            if (hasLoaded) {
                // console.info(`${fontName} ${fontStyle} ${fontWeight} loaded`);
                clearLoop()
                resolve();
            }
        }

        loop = setInterval(tryToLoadFont, 500);
    })
}