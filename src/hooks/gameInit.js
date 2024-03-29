const resetStats = function (room) {
    window.hax.roomStats.lastPlayerTouched = undefined
    window.hax.roomStats.secondToLastPlayerTouched = undefined

    window.hax.matchStats.goals = []
    window.hax.matchStats.bluePossession = 0
    window.hax.matchStats.redPossession = 0

    return { message: 'stats reset' }
}

const serverHook = (e) => {
    console.log(`Stats reset: ${JSON.stringify(e)}`)
}

export default [
    {
        event: 'STATS_RESET',
        roomEvents: ['onGameStart'],
        clientHook: resetStats,
        serverHook,
    },
]
