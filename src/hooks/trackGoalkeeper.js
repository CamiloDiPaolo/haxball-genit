const storeGoalIntent = function(room, player) {
    function pointDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }

    function haxDegree(center, p) {
        const x = Math.abs(p.x - center.x)
        const y = Math.abs(p.y - center.y)

        return Math.atan(y / x) * 57.3 // conver radians to degree
    }
    // como calcular la proxima posicion del disco:
    // x = x + xspeed
    // xspeed = xspeed * damping
    const disc = room.getDiscProperties(0)
    const scores = room.getScores()
    const ballPosition = room.getBallPosition()

    let x = disc.x + disc.xspeed
    let y = disc.y + disc.yspeed

    // calculamos 10 ticks en el futuro si se va a dar un gol
    window.hax.roomStats.posibleBlueGoal = false
    window.hax.roomStats.posibleRedGoal = false

    const blueGoal = JSON.parse(window.hax.goals.blue)
    const redGoal = JSON.parse(window.hax.goals.red)

    for (let i = 0; i < 15; i++) {
        x = x + disc.xspeed * 5
        y = y + disc.yspeed * 5

        if (x > blueGoal.p0[0] && y < blueGoal.p0[1] && y > blueGoal.p1[1]) {
            window.hax.roomStats.posibleBlueGoal = true
            break
        }

        if (x < redGoal.p0[0] && y < redGoal.p0[1] && y > redGoal.p1[1]) {
            window.hax.roomStats.posibleRedGoal = true
            break
        }
    }

    const shoot = {
        distance: pointDistance(player.position, ballPosition),
        haxDegree: haxDegree(ballPosition, player.position),
        time: scores.time,
        player,
    }

    if (
        player.team === window.hax.config.RED_TEAM_ID &&
        window.hax.roomStats.posibleBlueGoal
    )
        window.hax.matchStats.shots.push(shoot)

    if (
        player.team === window.hax.config.BLUE_TEAM_ID &&
        window.hax.roomStats.posibleRedGoal
    )
        window.hax.matchStats.shots.push(shoot)
}

const storeGoalKeeper = function(room) {
    function pointDistance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y)
    }


    if (
        !window.hax.roomStats.posibleRedGoal &&
        !window.hax.roomStats.posibleBlueGoal
    )
        return

    const blueGoal = JSON.parse(window.hax.goals.blue)
    const redGoal = JSON.parse(window.hax.goals.red)

    // 2. calcular la intercepcion de una pelota que va al arco
    const ballPosition = room.getBallPosition()
    const players = room.getPlayerList()
    const disc = room.getDiscProperties(0)
    let goalKeeper = null


    players
        .filter(({ team }) =>
            window.hax.roomStats.posibleBlueGoal
                ? team === window.hax.config.BLUE_TEAM_ID
                : team === window.hax.config.RED_TEAM_ID
        )
        .forEach((player) => {
            if (player.position === null) return

            const distanceToBall = pointDistance(player.position, ballPosition)

            if (distanceToBall > window.hax.config.TRIGGER_DISTANCE) return

            // if user touch the ball then calculate the goal line
            let x = disc.x + disc.xspeed
            let y = disc.y + disc.yspeed
            let goal = false


            for (let i = 0; i < 10; i++) {
                x = x + disc.xspeed * 5
                y = y + disc.yspeed * 5

                if (
                    x > blueGoal.p0[0] &&
                    y < blueGoal.p0[1] &&
                    y > blueGoal.p1[1]
                ) {
                    goal = true
                    break
                }

                if (
                    x < redGoal.p0[0] &&
                    y < redGoal.p0[1] &&
                    y > redGoal.p1[1]
                ) {
                    goal = true
                    break
                }
            }

            if (!goal) goalKeeper = player
        })

    // 3. si el jugador esta en la zona es atajada, sino es despeje
    if (!goalKeeper) return

    const scores = room.getScores()
    window.hax.roomStats.posibleBlueGoal = false
    window.hax.roomStats.posibleRedGoal = false

    let isInGoalkeeperZone

    if (goalKeeper.team === window.hax.config.RED_TEAM_ID) {
        isInGoalkeeperZone =
            goalKeeper.position.x <
            redGoal.p0[0] + window.hax.config.GOALKEEPER_OFFSET_X &&
            goalKeeper.position.y <
            redGoal.p0[1] + window.hax.config.GOALKEEPER_OFFSET_Y &&
            goalKeeper.position.y >
            redGoal.p1[1] - window.hax.config.GOALKEEPER_OFFSET_Y
    } else {
        isInGoalkeeperZone =
            goalKeeper.position.x >
            blueGoal.p0[0] - window.hax.config.GOALKEEPER_OFFSET_X &&
            goalKeeper.position.y <
            blueGoal.p0[1] + window.hax.config.GOALKEEPER_OFFSET_Y &&
            goalKeeper.position.y >
            blueGoal.p1[1] - window.hax.config.GOALKEEPER_OFFSET_Y
    }

    if (isInGoalkeeperZone) {
        window.hax.matchStats.headOff.push({
            player: goalKeeper,
            time: scores.time,
        })
    } else {
        window.hax.matchStats.intercepts.push({
            player: goalKeeper,
            time: scores.time,
        })
    }
}

const resetGoalIntent = function(room) {
    window.hax.roomStats.posibleBlueGoal = false
    window.hax.roomStats.posibleRedGoal = false
}

export default [
    {
        event: 'GOAL_INTENT',
        roomEvents: ['onPlayerBallKick'],
        clientHook: storeGoalIntent,
        serverHook: null,
    },
    {
        event: 'GOAL_KEEPER',
        roomEvents: ['onGameTick'],
        clientHook: storeGoalKeeper,
        serverHook: null,
    },
    {
        event: 'GOAL_INTENT_RESET',
        roomEvents: ['onTeamGoal'],
        clientHook: resetGoalIntent,
        serverHook: null,
    },
]
