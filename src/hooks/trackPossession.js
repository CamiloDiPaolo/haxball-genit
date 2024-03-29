const storePossession = function (room) {
    function pointDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }

    const ballPosition = room.getBallPosition()
    const players = room.getPlayerList()

    players.forEach((player) => {
        if (player.position === null) return

        const distanceToBall = pointDistance(player.position, ballPosition)

        if (distanceToBall > window.hax.config.TRIGGER_DISTANCE) return

        window.hax.roomStats.lastPlayerTouched = player
        if (player.team === window.hax.config.RED_TEAM_ID)
            window.hax.matchStats.redPossession++
        else window.hax.matchStats.bluePossession++
    })
}

const serverHook = (e) => {
    console.log(`POSSESSION: ${JSON.stringify(e)}`)
}

export default [
    {
        event: 'POSSESSION',
        roomEvents: ['onGameTick'],
        clientHook: storePossession,
        serverHook: null,
    },
]
