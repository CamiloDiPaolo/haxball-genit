# HAXBALL custom room

This repo create a haxball room and allow customization mannualy.

# Config

In the config.js file you can add some global data for use it  in the hooks.

# Hooks

The hooks are pieces of code that add event listeners and handlers for haxball native events. 
For use them you can add a .js file in the hooks folder and return the following array:

```javascript
// Client hook: this code run in the haxball browser, and the return data will be send to the server
const playerUpdate = () => {
    const players = room.getPlayerList();
    return { currentPlayers: players[0] }
}

// Server hook: this code run in the server, and receive the return of clientHook as param  
const serverHook = (e) => { console.log(`An user has join: ${JSON.stringify(e.currentPlayers)}`) }

// the event is the name of your custom hook
// the roomEvents is an array of haxball events that trigger your clientHook
export default [{
    event: 'UPDATE_ADMINS',
    roomEvents: ['onPlayerJoin', 'onPlayerLeave'],
    clientHook: updateAdmins,
    serverHook
}]
```
