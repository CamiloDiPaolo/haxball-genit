import pg from 'pg'
import { insertPlayers } from '../db/players.js'
const { Client } = pg

const saveStats = function(room, scores) {
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

const serverHook = async (stats) => {
    try {
        const client = new Client()
        await client.connect()


        // insert user if not found
        const playerIdsAndNames = await insertPlayers(client, stats.players)

        // create match
        const matchId = (await client.query({
            text: `INSERT INTO matchs(blue_goals, blue_possession, red_goals, red_possession, time) VALUES($1, $2, $3, $4, $5) RETURNING id`,
            values: [
                stats.blueGoals,
                stats.bluePossession,
                stats.redGoals,
                stats.redPossession,
                stats.time
            ],
        })).rows[0].id

        // associate match with players
        await Promise.all(playerIdsAndNames.map(async ({ id, name }) => {
            await client.query({
                text: `INSERT INTO players_in_match(match_id, player_id, team_id) VALUES($1, $2, $3)`,
                values: [
                    matchId,
                    id,
                    stats.players.find((p) => p.name === name).team
                ],
            })
        }))

        // store goals
        await Promise.all(stats.goals.map(async (goal) => {
            console.log('STRIKER: ', playerIdsAndNames.find(({ name }) => name === goal.player.name))
            const { id: strikerId } = playerIdsAndNames.find(({ name }) => name === goal.player.name)
            const { id: assistantId } = playerIdsAndNames.find(({ name }) => goal.assistance && name === goal.assistance.name) ?? { id: null }

            await client.query({
                text: `INSERT INTO goals(time, distance, hax_degree, position, team_id, match_id, player_id, player_assistant_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8)`,
                values: [
                    goal.time,
                    goal.distance,
                    goal.haxDegree,
                    goal.player.position,
                    goal.player.team,
                    matchId,
                    strikerId,
                    assistantId ?? null
                ],
            })
        }))

        // store shots
        await Promise.all(stats.shots.map(async (goal) => {
            const { id: strikerId } = playerIdsAndNames.find(({ name }) => name === goal.player.name)

            await client.query({
                text: `INSERT INTO shots(time, distance, hax_degree, position, team_id, match_id, player_id) VALUES($1, $2, $3, $4, $5, $6, $7)`,
                values: [
                    goal.time,
                    goal.distance,
                    goal.haxDegree,
                    goal.player.position,
                    goal.player.team,
                    matchId,
                    strikerId,
                ],
            })
        }))

        // store headOff
        await Promise.all(stats.shots.map(async (goal) => {
            const { id: strikerId } = playerIdsAndNames.find(({ name }) => name === goal.player.name)

            await client.query({
                text: `INSERT INTO head_off(time, position, match_id, player_id) VALUES($1, $2, $3, $4)`,
                values: [
                    goal.time,
                    goal.player.position,
                    matchId,
                    strikerId,
                ],
            })
        }))

        // store intercepts
        await Promise.all(stats.shots.map(async (goal) => {
            const { id: strikerId } = playerIdsAndNames.find(({ name }) => name === goal.player.name)

            await client.query({
                text: `INSERT INTO intercepts(time, position, match_id, player_id) VALUES($1, $2, $3, $4)`,
                values: [
                    goal.time,
                    goal.player.position,
                    matchId,
                    strikerId,
                ],
            })
        }))

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

