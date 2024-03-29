function storeLastToucher(room, player) {
    console.log('PLAYER KICK BALL: ', player.name)
    if (
        window.hax.roomStats.lastPlayerKicked &&
        window.hax.roomStats.lastPlayerKicked.name !== player.name
    )
        window.hax.roomStats.secondToLastPlayerKicked = {
            ...window.hax.roomStats.lastPlayerKicked,
        }
    window.hax.roomStats.lastPlayerKicked = { ...player }
}

function returnLastToucher(room, team) {
    function pointDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }

    function haxDegree(center, p) {
        const x = Math.abs(p.x - center.x)
        const y = Math.abs(p.y - center.y)

        return Math.atan(y / x) * 57.3 // conver radians to degree
    }

    const scores = room.getScores()
    const ballPosition = room.getBallPosition()

    const { lastPlayerKicked, secondToLastPlayerKicked, lastPlayerTouched } =
        window.hax.roomStats

    const against = lastPlayerKicked
        ? lastPlayerKicked.team !== team
        : lastPlayerTouched.team !== team
    const assistanceAgainst = secondToLastPlayerKicked
        ? secondToLastPlayerKicked.team !== team
        : true
    const goal = {
        player: lastPlayerKicked ?? lastPlayerTouched,
        assistance: assistanceAgainst ? null : secondToLastPlayerKicked,
        against,
        time: scores.time,
        distance: pointDistance(
            lastPlayerKicked
                ? lastPlayerKicked.position
                : lastPlayerTouched.position,
            ballPosition
        ),
        haxDegree: haxDegree(
            ballPosition,
            lastPlayerKicked
                ? lastPlayerKicked.position
                : lastPlayerTouched.position
        ),
    }

    window.hax.matchStats.goals.push(goal)

    return window.hax.matchStats
}

const serverHook = (e) => {
    console.log(`Evento del browser: ${JSON.stringify(e)}`)
}

export default [
    {
        event: 'GOAL',
        roomEvents: ['onTeamGoal'],
        clientHook: returnLastToucher,
        serverHook,
    },
    {
        event: 'BALL_KICK',
        roomEvents: ['onPlayerBallKick'],
        clientHook: storeLastToucher,
        serverHook: null,
    },
]
