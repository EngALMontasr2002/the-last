export async function styleSheetsLoader($styleSheets, callback) {
    const styleSheetObservers = [];

    if (!$styleSheets.length) return console.log("Uh oh ! You need to select a <link> element");

    $styleSheets.forEach(($styleSheet) => {
        const observer = loadStylesheet($styleSheet);
        styleSheetObservers.push(observer);
    });

    try {
        await Promise.all(styleSheetObservers);
        callback ? .();
    } catch (err) {
        console.warn("Some critical font are not available:", err);
    }
}


export function loadStylesheet($styleSheet) {
    return new Promise((resolve) => {
        let loop = null

        const clearLoop = () => {
            if (loop) {
                clearInterval(loop)
                loop = null
            }
        }

        const checkStyleSheetLoading = () => {

            let hasLoaded = false;

            try {
                hasLoaded = $styleSheet.getAttribute("data-is-loaded") == 'true' ? true : false;
            } catch (error) {
                console.info(`Error with a styleSheet`, error);
                console.info(`This one ->`, $styleSheet);
                clearLoop()
                resolve();
            }

            if (hasLoaded) {
                console.info(`This stylesheet is loaded`, $styleSheet);
                clearLoop()
                resolve();
            }
        }

        loop = setInterval(checkStyleSheetLoading, 100);
    })
}