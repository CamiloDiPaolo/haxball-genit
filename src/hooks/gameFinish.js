import pg from 'pg'
const { Client } = pg

const saveStats = function (room, scores) {
    const players = room.getPlayerList()

    const stats = {
        ...window.hax.matchStats,
        time: Math.floor(scores.time),
        redGoals: scores.red,
        blueGoals: scores.blue,
        players,
    }

    const parseTime = (sec) => {
        const minutes = Math.floor(sec / 60)
        const secs = sec - minutes * 60

        return `${minutes >= 10 ? '' : 0}${minutes}:${secs >= 10 ? '' : 0}${Math.floor(secs)}`
    }

    const teams = ['_', '🔴', '🔵']
    const teamsAgainst = ['_', '🔵', '🔴']

    const winner = scores.red > scores.blue ? '🔴' : '🔵'

    const goalsString = window.hax.matchStats.goals
        .sort((goal1, goal2) => goal1.time - goal2.time)
        .map(
            (goal) =>
                `[${parseTime(goal.time)}](${goal.against ? teamsAgainst[goal.player.team] : teams[goal.player.team]}): ${goal.player.name}${goal.assistance ? ` Assistance: ${goal.assistance.name} ` : ''} - ${Math.floor(goal.distance)}m - ${Math.floor(goal.haxDegree)}haxDeg `
        )

    room.sendAnnouncement(`FIN DEL PARTIDO 
        \n🏅${winner} (🔴${scores.red} - ${scores.blue}🔵)
        \n${goalsString.join('\n')}`)

    return stats
}

/*
    matchStats: {
                goals: [],
                bluePossession: 0, // calc on ticks
                redPossession: 0,
            }
    exports.up = pgm => {
    pgm.createTable('matchs', {
        id: 'id',
        createdAt: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp')
        },
        time: { type: 'integer', notNull: true },
        players: { type: 'json', notNull: true },
        redPossession: { type: 'integer', notNull: true },
        bluePossession: { type: 'integer', notNull: true },
        redGoals: { type: 'integer', notNull: true },
        blueGoals: { type: 'integer', notNull: true },
        goals: { type: 'json', notNull: true }
    })
}
*/

const serverHook = async (stats) => {
    try {
        const client = new Client()
        await client.connect()

        const query = {
            text: `INSERT INTO matchs(blue_goals, blue_possession, red_goals, red_possession, time, players, goals) VALUES($1, $2, $3, $4, $5, $6, $7)`,
            values: [
                stats.blueGoals,
                stats.bluePossession,
                stats.redGoals,
                stats.redPossession,
                stats.time,
                JSON.stringify(stats.players),
                JSON.stringify(stats.goals),
            ],
        }

        await client.query(query)

        await client.end()

        console.log(`Stats save successfully`)
    } catch (err) {
        console.log(`error saving stats: `, err)
    }
}

export default [
    {
        event: 'STATS_AVE',
        roomEvents: ['onTeamVictory'],
        clientHook: saveStats,
        serverHook,
    },
]
