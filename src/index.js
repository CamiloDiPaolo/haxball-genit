import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'

const __dirname = new URL('.', import.meta.url).pathname;

const PORT = 8000;

// get token from: https://www.haxball.com/headlesstoken
const TOKEN = 'thr1.AAAAAGYEveqQbjmndc46-g.QEE91kFZjGs'

const DEVICE = {
    name: 'CUSTOM DEVICE',
    userAgent:
        'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3452.0 Mobile Safari/537.36',
    viewport: {
        width: 1000,
        height: 1000,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        isLandscape: false,
    },
};

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
    // 1) launch the browser
    const browser = await createAndLaunchBrowser()

    // 2) create a new page
    const page = await browser.newPage()
    await page.emulate(DEVICE)

    // 3) load custom hooks
    let hooks = [];
    const hooksFiles = fs.readdirSync(path.join(__dirname, 'hooks'));
    await Promise.all(hooksFiles.map(async (fileName) => {
        const hookPath = path.join(__dirname, `hooks/${fileName}`)

        const hook = (await import(hookPath)).default

        if (hooks.some(({ event }) => hook.event === event)) throw new Error('Duplicate hook event')

        // fix this: if the hook dont have a return then not trigger the event
        hooks.push(...hook);
    }))


    const clientHooksGroupedByEvent = hooks.reduce((acc, hook) => {
        hook.roomEvents.forEach(event => {
            if (!acc[event]) {
                acc[event] = {
                    emitEvent: [hook.event],
                    clientHooks: [String(hook.clientHook)],
                }
            } else {
                acc[event].emitEvent.push(hook.event);
                acc[event].clientHooks.push(String(hook.clientHook));
            }
        });

        return acc
    }, {})

    // 4) initialize haxball page
    await initializeHaxballPage(page, hooks)

    // 5) load global data/config
    await page.addScriptTag({ path: path.join(__dirname, 'config.js') })

    // 6) open room
    await page.evaluate(openRoom, clientHooksGroupedByEvent)

    // 7) get room link
    const haxframe = await getHaxIframe(page);
    const roomLink = await getRoomLink(page, haxframe, 10000);


    // 8) enjoy the hax
    console.info('ROOM LINK GENERATED: ', roomLink)
}

const getRoomLink = async (page, haxframe, timeout) => {
    let startTime = new Date().getTime();
    let currentTime = new Date().getTime();
    let roomStarted = false;

    while (!roomStarted && timeout > currentTime - startTime) {
        // if the recaptcha appears the token must be invalid
        let recaptcha = await haxframe.$eval('#recaptcha', (e) => e.innerHTML);
        if (recaptcha) {
            throw new Error(`Token is invalid or has expired!`);
        }
        roomStarted = await page.evaluate(`window.hasLink`);
        await sleep(1000);
        currentTime = new Date().getTime();
    }

    return await haxframe.$eval('#roomlink a', (element) => {
        return element.getAttribute('href');
    });
}

const getHaxIframe = async (page) => {
    const elementHandle = await page.$('iframe');
    const haxframe = await elementHandle.contentFrame();
    return haxframe;
}

// Haxball side code
const openRoom = async (hooksGroupedByEvent) => {
    const room = HBInit(
        {
            roomName: "My room",
            maxPlayers: 16,
            noPlayer: true,
            token: 'thr1.AAAAAGYEveqQbjmndc46-g.QEE91kFZjGs'
        }
    )

    // CUSTOM HOOKS START
    Object.entries(hooksGroupedByEvent).forEach(([event, hook]) => {
        room[event] = () => {
            const returnData = hook.clientHooks.map(fnString => eval(`const fn = ${fnString}; fn()`))

            hook.emitEvent.forEach((serverEvent, i) => {
                if (!returnData[i] || returnData[i] === 'null') return;

                sendBrowserAction({ event: serverEvent, data: returnData[i] })
            })
        }
    })
    // CUSTOM HOOKS END

    room.onRoomLink = () => {
        window.hasLink = true;
    };
}

const initializeHaxballPage = async (page, hooks) => {
    // 1. navigate to haxball headless page
    page.goto('https://haxball.com/headless')

    // 2. wait for haxball to load
    await page.waitForFunction('typeof HBInit === "function"');

    // 3. init browser communication channel
    await page.exposeFunction(
        'sendBrowserAction',

        (e) => {
            if (!hooks.some(({ event }) => e.event === event))
                return console.info(`[${e.event}](no registrado): ${JSON.stringify(e)}`)

            console.info(`[${e.event}]: ${JSON.stringify(e)}`)
            hooks.find(({ event }) => e.event === event).serverHook(e.data)
        }
    );
}

const createAndLaunchBrowser = async () => {
    const browserArgs = [`--remote-debugging-port=${PORT}`, `--disable-features=WebRtcHideLocalIpsWithMdns`, '--no-sandbox', '--disable-setuid-sandbox']

    const launchOptions = {
        headless: true,
        devtools: false,
        userDataDir: path.join(__dirname, 'data'),
        args: browserArgs
    }

    return puppeteer.launch(launchOptions)
}


main()
