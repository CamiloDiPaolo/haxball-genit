function storeLastToucher() {
    function pointDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }

    const ballPosition = room.getBallPosition()
    const players = room.getPlayerList()

    players.forEach((player) => {
        if (player.position === null) return

        const distanceToBall = pointDistance(player.position, ballPosition)

        if (distanceToBall > window.hax.config.triggerDistance) return

        window.hax.roomStats.lastPlayerTouched = player
    })
}

function returnLastToucher() {
    return window.hax.roomStats.lastPlayerTouched
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
        event: 'TICK',
        roomEvents: ['onGameTick'],
        clientHook: storeLastToucher,
        serverHook,
    },
]
