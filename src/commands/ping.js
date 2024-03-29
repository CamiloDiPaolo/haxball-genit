/*
room.onPlayerChat = function(player, message) {
    const playerAuth = playersPlaying.find(playerPlaying => playerPlaying.name == player.name).auth;
    if (message.toLowerCase() == "!stats") {
        room.sendAnnouncement(`𝗦𝗧𝗔𝗧𝗦 𝗗𝗘 ${player.name}\n
        🏅 Victorias: ${playersHistoricalList[playerAuth].wins}\n
        💩 Derrotas: ${playersHistoricalList[playerAuth].losses}\n
        🎯 Goles: ${playersHistoricalList[playerAuth].goals}\n
        🧠 Asistencias: ${playersHistoricalList[playerAuth].assists}\n
        🥶 Goles en contra: ${playersHistoricalList[playerAuth].owngoals}`);
    }
}
*/

const handler = function (room, player, message) {
    room.sendAnnouncement('pong')

    return { message: 'PING!' }
}

const serverAction = (e) => {
    console.log(`El user mando este comando: ${JSON.stringify(e)}`)
}

export default {
    handler,
    serverAction,
}
