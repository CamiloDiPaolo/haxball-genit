const updateAdmins = (room) => {
    // Get all players
    const players = room.getPlayerList()

    if (players.length == 0) return // No players left, do nothing.

    if (players.find((player) => player.admin) != null) return // There's an admin left so do nothing.

    room.setPlayerAdmin(players[0].id, true) // Give admin to the first non admin player in the list

    return { message: 'admin update', newAdmin: players[0] }
}

const serverHook = (e) => {
    console.log(`Evento del browser de ADMIN: ${JSON.stringify(e)}`)
}

export default [
    {
        event: 'UPDATE_ADMINS',
        roomEvents: ['onPlayerJoin', 'onPlayerLeave'],
        clientHook: updateAdmins,
        serverHook,
    },
]
