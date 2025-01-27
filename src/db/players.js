export const insertPlayers = async (client, players) => {
    const playerIds = await Promise.all(players.map(async (player) => {
        const query = {
            text: `
                    INSERT INTO players (name) 
                    SELECT $1
                    WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = $1)
                    RETURNING id, name;
                `,
            values: [player.name]
        }

        let res = await client.query(query)

        if (res.rows.length && 'id' in res.rows[0])
            return res.rows[0]

        const queryId = {
            text: `
                    SELECT id, name from players
                    WHERE name = $1
                    LIMIT 1
                `,
            values: [player.name]
        }

        res = await client.query(queryId)

        return res.rows[0]
    }))


    return playerIds
}
