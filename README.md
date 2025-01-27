# HAXBALL custom room

This repo create a haxball room and allow customization mannualy.

## Config

In the config.js file you can add some global data for use it  in the hooks.

## Run

For run the server you can use `node src/index.js [headless token]`

## Command

Custom commands are added in the commands folder. The name of te file is the name of the command ex: ping.js -> !ping. 

The default return of the file is a object with a two properties: handler and serverAction

The function to return receive 3 arguments: the room object, the player and the message

```javascript
// commands/ping.js

// Client handler: this code run in the haxball browser, and the return data will be send to the server
// All command receive 3 args: the room object, the player and the message
const handler = function(room, player, message) {
    room.sendAnnouncement('pong')

    return { message: 'PING!' }
}

// Server action: this code run on the server, and receive the return of the handler
const serverAction = (e) => {
    console.log(`El user mando este comando: ${JSON.stringify(e)}`)
}

export default {
    handler,
    serverAction
}
```

## Hooks

The hooks are pieces of code that add event listeners and handlers for haxball native events. 
For use them you can add a .js file in the hooks folder and return the following array:


```javascript
// Client hook: this code run in the haxball browser, and the return data will be send to the server
// All client hook receive 2 args: the room object and the event 
const playerUpdate = (room, e) => {
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

## Migrations

```bash
# create migration
npm run migrate:create [name]

# run migrations
npm run migrate:run
```
