/* Config all global data in this file, this data will be available in all hooks */

window.hax = window.hax ?? {};

Object.assign(
    window.hax,
    (function() {
        return {
            test: 'test global',
            config: {
                triggerDistance: 25.01 //radio de la pelota + radio de jugador + 0.01
            },
            roomStats: {
                lastPlayerTouched: undefined,
                teams: ["⚪️", "🔴", "🔵"],
            }
        }
    })()
)
