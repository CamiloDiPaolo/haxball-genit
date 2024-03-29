const handler = function (room, player, args) {
    const map = args[0]

    if (!map)
        return room.sendAnnouncement(
            'Ta complicado setear el mapa si no me pasas uno',
            null,
            0xff0000
        )

    if (!window.hax.maps[map])
        return room.sendAnnouncement('El mapa no esta cargado', null, 0xff0000)

    const goals = JSON.parse(window.hax.maps[map]).goals

    window.hax.goals.blue = JSON.stringify(
        goals.find((goal) => goal.team === 'blue')
    )
    window.hax.goals.red = JSON.stringify(
        goals.find((goal) => goal.team === 'red')
    )
    room.setCustomStadium(window.hax.maps[map])
}

export default {
    handler,
    serverAction: null,
}
