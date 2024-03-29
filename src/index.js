import 'dotenv/config'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'

import pg from 'pg'

const { Client } = pg
const __dirname = new URL('.', import.meta.url).pathname;

const PORT = 8000;

// get token from: https://www.haxball.com/headlesstoken
const TOKEN = 'thr1.AAAAAGYGLQ_5uI90tNPbFw.Lemtf_cAyCk'

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
    // added listener for client side console.log function
    page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`))
        .on('pageerror', ({ message }) => console.log(`[BROWSER ERROR]: ${message}`))

    // 3) load maps
    let maps = [];
    const mapsFiles = fs.readdirSync(path.join(__dirname, 'maps'));
    await Promise.all(mapsFiles.map(async (fileName) => {
        const mapPath = path.join(__dirname, `maps/${fileName}`)

        const map = (await import(mapPath)).default
        maps.push(JSON.stringify(map))
    }))

    // 4) load commands
    let commands = [];
    const commandsFiles = fs.readdirSync(path.join(__dirname, 'commands'));
    await Promise.all(commandsFiles.map(async (fileName) => {
        const commandPath = path.join(__dirname, `commands/${fileName}`)
        const commandName = fileName.replace('.js', '')

        const command = (await import(commandPath)).default

        if (commands.some(({ name }) => name === commandName)) throw new Error('Duplicate command')

        commands.push({ name: commandName, handler: String(command.handler), serverAction: command.serverAction });
    }))

    // 5) load custom hooks
    let hooks = [];
    const hooksFiles = fs.readdirSync(path.join(__dirname, 'hooks'));
    await Promise.all(hooksFiles.map(async (fileName) => {
        const hookPath = path.join(__dirname, `hooks/${fileName}`)

        const hook = (await import(hookPath)).default

        if (hooks.some(({ event }) => hook.event === event)) throw new Error('Duplicate hook event')

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

    // 6) initialize haxball page
    await initializeHaxballPage(page, hooks, commands)

    // 7) load global data/config
    await page.addScriptTag({ path: path.join(__dirname, 'config.js') })

    // 8) open room
    await page.evaluate(openRoom, TOKEN, clientHooksGroupedByEvent, commands, maps)

    // 9) get room link
    const haxframe = await getHaxIframe(page);
    const roomLink = await getRoomLink(page, haxframe, 10000);


    // 10) enjoy the hax
    console.info('[SERVER]: ROOM LINK GENERATED: ', roomLink)

    // 11) check db connection
    try {
        const client = new Client()
        await client.connect()
        await client.query('SELECT NOW()')
        await client.end()
        console.info('[SERVER]: DB CONNECTED')
    } catch (err) {
        console.info('[SERVER]: Error conectando con la db, no sera posible guardar las estadisticas')
    }
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
const openRoom = async (token, hooksGroupedByEvent, commands, maps) => {
    const room = HBInit(
        {
            roomName: "Gen IT @ Official Server",
            public: false,
            maxPlayers: 12,
            noPlayer: true,
            // playerName: "🎙️RELATOR",
            token
        }
    )

    // Commands load
    room.onPlayerChat = function(player, message) {
        const [commandName, ...args] = message.split(' ')

        const command = commands.find(({ name }) => `!${name}` === commandName)

        if (!command) return;

        const fn = new Function(`{ return ${command.handler} }`)
        const data = fn.call(null).call(null, room, player, message)

        if (!data) return;

        sendBrowserAction({ event: `COMMAND:${commandName}`, data })
    }
    // Commands load end
    console.info('Custom commands loaded')

    // Hooks load
    Object.entries(hooksGroupedByEvent).forEach(([event, hook]) => {
        room[event] = (e) => {
            // const returnData = hook.clientHooks.map(fnString => eval(`const fn = ${fnString}; fn(${e})`))
            const returnData = hook.clientHooks.map(fnString => {
                const fn = new Function(`{ return ${fnString} }`)
                return fn.call(null).call(null, room, e)
            })

            hook.emitEvent.forEach((serverEvent, i) => {
                if (!returnData[i] || returnData[i] === 'null' || returnData[i] === 'undefined') return;

                sendBrowserAction({ event: serverEvent, data: returnData[i] })
            })
        }
    })
    // Hooks load end
    console.info('Custom hooks loaded')

    // Maps load
    // TODO: add command for select maps
    room.setCustomStadium(maps[0])
    // Maps load end
    console.info('Default map set: ', JSON.parse(maps[0]).name)

    room.onRoomLink = () => {
        window.hasLink = true;
    };

    console.info('Room started')
}

const initializeHaxballPage = async (page, hooks, commands) => {
    // 1. navigate to haxball headless page
    page.goto('https://haxball.com/headless')

    // 2. wait for haxball to load
    await page.waitForFunction('typeof HBInit === "function"');

    // 3. init browser communication channel
    await page.exposeFunction(
        'sendBrowserAction',

        (e) => {
            const hook = hooks.find(({ event }) => e.event === event)
            const command = commands.find(({ name }) => e.event === `COMMAND:!${name}`)

            if (hook)
                return hook.serverHook(e.data)
            if (command)
                return command.serverAction(e.data)

            return console.info(`[${e.event}(NOT REGISTER)]: ${JSON.stringify(e)}`)

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
