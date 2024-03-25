import puppeteer from 'puppeteer'
import path from 'path'
import { URL } from 'url'

const __dirname = new URL('.', import.meta.url).pathname;

const PORT = 8000;

// get token from: https://www.haxball.com/headlesstoken
const TOKEN = 'thr1.AAAAAGYAuZUGL-NI_4BFOg.eK5U2IFvQNQ'

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

    // 3) initialize haxball page
    await initializeHaxballPage(page)

    // 4) open room
    await page.evaluate(openRoom, { token: TOKEN })

    // 5) get room link
    const haxframe = await getHaxIframe(page);
    const roomLink = await getRoomLink(page, haxframe, 10000);

    console.info('ROOM LINK GENERATED')

    console.log(roomLink)
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

const openRoom = async () => {
    // Client side code
    const room = HBInit(
        {
            roomName: "My room",
            maxPlayers: 16,
            noPlayer: true,
            token: 'thr1.AAAAAGYAuZUGL-NI_4BFOg.eK5U2IFvQNQ'
        }
    )

    function updateAdmins() {
        // Get all players
        var players = room.getPlayerList();
        if (players.length == 0) return; // No players left, do nothing.
        if (players.find((player) => player.admin) != null) return; // There's an admin left so do nothing.
        room.setPlayerAdmin(players[0].id, true); // Give admin to the first non admin player in the list
    }

    room.onPlayerJoin = function(player) {
        sendBrowserAction({ event: "PLAYER JOIN", data: player })
        updateAdmins();
    }

    room.onPlayerLeave = function(player) {
        sendBrowserAction({ event: "PLAYER LEAVE", data: player })
        updateAdmins();
    }

    let roomObject = {
        lastTeamTouched: 0,
        lastPlayerTouched: undefined,
        previousPlayerTouched: undefined,
        assistingTouch: undefined,
        activity: { red: 0, blue: 0 },
        possession: { red: 0, blue: 0 },
        teams: ["⚪️", "🔴", "🔵"],
        triggerDistance: 25.01 //radio de la pelota + radio de jugador + 0.01
    }

    room.onGameTick = () => {
        function pointDistance(p1, p2) {
            return Math.hypot(p1.x - p2.x, p1.y - p2.y);
        }

        function getLastToucher() {
            var ballPosition = room.getBallPosition();
            var players = room.getPlayerList();
            if (roomObject.lastTeamTouched != 0) roomObject.lastTeamTouched == 1 ? roomObject.possession.red++ : roomObject.possession.blue++;
            if (ballPosition.x != 0) ballPosition.x < 0 ? roomObject.activity.red++ : roomObject.activity.blue++;
            for (var i = 0; i < players.length; i++) {
                if (players[i].position != null) {
                    var distanceToBall = pointDistance(players[i].position, ballPosition);
                    if (distanceToBall < roomObject.triggerDistance) {
                        if (roomObject.lastPlayerTouched == undefined || (roomObject.lastPlayerTouched != undefined && roomObject.lastPlayerTouched.id != players[i].id)) {
                            if (roomObject.lastTeamTouched == players[i].team) {
                                roomObject.assistingTouch = roomObject.lastPlayerTouched;
                            }
                            else roomObject.assistingTouch = undefined;
                        }
                        roomObject.lastTeamTouched = players[i].team;
                        roomObject.previousPlayerTouched == roomObject.lastPlayerTouched;
                        roomObject.lastPlayerTouched = players[i];
                    }
                }
            }
            return roomObject.lastPlayerTouched;
        }

        getLastToucher()
    }

    room.onTeamGoal = () => {
        // send an event every time a player scores a goal
        sendBrowserAction({ event: "GOAL", data: roomObject })
    }

    room.onRoomLink = () => {
        window.hasLink = true;
    };


}

const initializeHaxballPage = async (page) => {
    // 1. navigate to haxball headless page
    page.goto('https://haxball.com/headless')

    // 2. wait for haxball to load
    await page.waitForFunction('typeof HBInit === "function"');

    // 3. init browser communication channel
    await page.exposeFunction(
        'sendBrowserAction',
        (e) => { console.log(`Evento del browser: ${JSON.stringify(e)}`) }
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
