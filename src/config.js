/* Config all global data in this file, this data will be available in all hooks */

window.hax = window.hax ?? {};

Object.assign(
    window.hax,
    (function() {
        return {
            test: 'test global',
            maps: {},
            goals: {
                blue: {},
                red: {},
            },
            config: {
                TRIGGER_DISTANCE: 25.01, //radio de la pelota + radio de jugador + 0.01
                TEAMS: ["⚪️", "🔴", "🔵"],
                RED_TEAM_ID: 1,
                BLUE_TEAM_ID: 2,
                GOALKEEPER_OFFSET_X: 200,
                GOALKEEPER_OFFSET_Y: 50
            },
            roomStats: {
                lastPlayerTouched: undefined,
                lastPlayerKicked: undefined,
                secondToLastPlayerKicked: undefined,
                posibleBlueGoal: false,
                posibleRedGoal: false
            },
            matchStats: {
                goals: [], // effective goals
                shots: [], // shots on goal
                headOff: [], // goal avoided in the goal
                intercepts: [], // goal avoided outsite the goal
                bluePossession: 0,
                redPossession: 0,
            }
        }
    })()
)
