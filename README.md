# Discord Music Bot For Termux
[![License: Artistic-2.0](https://img.shields.io/badge/License-Artistic%202.0-0298c3.svg)](https://opensource.org/licenses/Artistic-2.0)
[![npm version](https://badge.fury.io/js/discord.js.svg)](https://badge.fury.io/js/discord.js)[![Open Source Love svg2](https://badges.frapsoft.com/os/v2/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![HitCount](http://hits.dwyl.io/fdciabdul/tmuxdcbot.svg)](http://hits.dwyl.io/fdciabdul/tmuxdcbot)

This bot can run in Android with termux or other OS <br>
Library: [Discord.js](https://discord.js.org)

## Installation:

### Termux
 - clone this repo 
 - `git clone https://github.com/fdciabdul/tmuxdcbot`
 - `cd tmuxdcbot`
 - `npm install`
## Commands:

## Configurations

Sett Discord Bot Token , API Youtube Key in
`config/botLogin.js`

```javascript
module.exports = {
        token: "TOKEN_KEY",
        youtubeAPI: "YOUTUBE_API_KEY",
        owner_id: "OWNER_ID"
}
```

### Admin Commands
  - `listgroup`: List groups that have admin access
  - `addgroup [group_name]`: Add a group to use admin access
  - `remgroup [group_name]`: Remove a group from admin access
  - `setusername [NAME]`: Set a username for the bot
  - `setavatar [URL]`: Set a avatar for the bot to use
  - `setgame [name]`: Sets the name of the game the bot is playing
  - `setinit [command]`: Sets the initial command the bot needs to enter commands e.g The "." in ".play"
  - `reports`: View reports that have been filed
  - `delreports`: Clear any reports that have been read
  - `exit`: disconnects bot from discord  

### General
  - `about`: About this bot
  - `stats`: View Stats
  - `report`: File a report
  - `uptime`: Uptime of the bot
  - `source`: Source link
  - `invite`: Get invite link for your bot
  - `setvc`: set the default voice channel this bot joins when ever the bot connects
  - `join`: Bot joins your voice channel

### Music
  - `queue` or `playing`: To view songs in queue
  - `play [YT_URL]`: Plays a song from a youtube link
  - `play [index_number]` : Plays a song from a file that has been saved to the bot
  - `play [search key term]`: Plays the first result of youtube search
  - `play [playlist_name or playlist_index]`: Loads a playlist to queue
  - `play`: Plays song in queue if it has been stopped  
  - `stop`: Stops the song from playing
  - `skip`: Skips to the next song
  - `replay`: Stops and replays song from the start
  - `readd`: Adds the current song back into queue
  - `loop`: Loops the entire queue, putting the current song back into queue
  - `local`: Displays all the songs saved by the bot
  - `remove [index_number]`: Removes a specific song from queue
  - `remove [#,#,#]`: Removes specific songs from the queue using it's index numbers seperated by commas
  - `save [YT_URL]`: Saves a song from youtube and stores it
  - `save`: Saves current song to local instead of downloading it from YT (faster)
  - `remlocal [index_number]`: Removes a song that has been saved locally
  - `playlist`: List all playlist
  - `playlist [playlist_index]`: List the songs of a playlist
  - `playlist save [playlist_name]`: Saves everything that is queued into a playlist
  - `playlist remove [playlist_index]`: Removes a playlist
  - `playlist remove [playlist_index] [playlist_track_index]`: Removes a playlist track from specified playlist
  - `playlist add [playlist_index] [YT_URL]`: Adds YouTube track into a playlist without having it queued
  - `playlist rename [playlist_name or playlist_index] [new_playlist_name]`: Renames a playlist
