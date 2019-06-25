const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const request = require('request');
const async = require('async');
const URL = require('url');
const bot = new Discord.Client();

// Paths
const modulesPath = path.join(__dirname, 'modules');
const localPath = path.join(__dirname, 'local');
const playlistPath = path.join(__dirname, 'playlist');
const tempFilesPath = path.join(__dirname, 'tempFiles');
const logsPath = path.join(__dirname, 'logs');
const configPath = path.join(__dirname, 'config');

// Modules
const yt = require(path.join(modulesPath, 'youtube.js'));


// Config
const botLogin = require(path.join(configPath, 'botLogin.js'));
const botPreferenceFile = path.join(configPath, 'preference.json');

// Get bot version
try{
	var botVersion = require(path.join(__dirname, 'package.json')).version;
}catch(err) {
	if(err) {
		console.error(new Error('Package.json not found'));
		var botVersion = "#?";
	}	
}

var botPreference = {initcmd: '.', adminGroups: 'admins'};

try{
	botPreference = JSON.parse(fs.readFileSync(botPreferenceFile));
}
catch(err){
	if(err) console.error(err);
	var defaultPreference = {initcmd: '.', adminGroups: 'admin'};
	fs.writeFile(botPreferenceFile, JSON.stringify(defaultPreference, null, '\t'), err =>{
		if(err) console.error(`Failed to write to ${botPreferenceFile}\n${err}`);
	});
}

var adminRoles = botPreference.admingroups;
var initcmd = botPreference.initcmd;
var defaultGame = (process.argv.length > 2)?`${process.argv.slice(2, process.argv.length).join(' ')} | v${botVersion}`:`v${botVersion} | ${initcmd}help`;

// The object voice channel the bot is in
var currentVoiceChannel = null;

// Playback
var queue = [];
var botPlayback;	// stream dispatcher
var voiceConnection;	// voice Connection object
var playing = false;
var stopped = false;
var stayOnQueue = false;
var looping = false;

// Check existence of folders
var folderPaths = [localPath, playlistPath, tempFilesPath, logsPath];
async.each(folderPaths, (path, callback) => {
	fs.access(path, fs.constants.F_OK, err => {
		if(err) {
			if(err.code === 'ENOENT'){
				fs.mkdir(path, err => {
					if(err) callback(err);
					else console.log(`Path created: ${path}\n`);
				});
			}
		}
	});
}, (err) => {
	if(err) console.log(`${err}\n`);
});

// Prints errors to console and also reports error to user
function sendError(title, error, channel){
	console.log("-----"  + "ERROR"+ "------");
	console.log(error);
	console.log("----------");
	channel.send("**" + title + " Error**\n```" + error.message +"```");
}

//	Credit: https://stackoverflow.com/questions/1303646/check-whether-variable-is-number-or-string-in-javascript#1303650
function isNumber(obj) {
	return !isNaN(parseFloat(obj))
}

// Command validation
function isCommand(message, command){
	var init = message.slice(0,1);
	var keyword = (message.indexOf(' ') !== -1) ? message.slice(1, message.indexOf(' ')) : message.slice(1);
	if(init === initcmd && keyword.toLowerCase() === command.toLowerCase() ){
		return true;
	}
	return false;
}

// Checks for a specific role the user is in to run admin commands
function isAdmin(message){
	var roles = message.member.roles.array();
	for(var role = 0; role < roles.length; role++){
		for( var i = 0; i < adminRoles.length; i++){
			if(roles[role].name.toLowerCase() === adminRoles[i])
				return true;
		}
	}
	return false;
}

function isOwner(message){
	if(message.member.id === botLogin.owner_id)
		return true
	else
		return false;
}

function getGuildByString(guildName){
	return bot.guilds.filterArray( (guild) =>{
		return guild.name === guildName;
	})[0];
}

function getChannelByString(guild, channelName){
	return guild.channels.filterArray( (channel) =>{
		return channel.name === channelName;
	})[0];
}

function setGame(game){
	bot.user.setActivity(game);
	if(game)
		console.log(`Game Set to ${game}`);
}

// Removes all temporary files downloaded from youtube
function removeTempFiles(){
	fs.readdir(tempFilesPath, (err, files) =>{
		if(err) callback(err);
		async.each(files, (file, callback) =>{
			fs.unlink(path.join(tempFilesPath, file), err =>{
				if(err) return callback(err);
			});
		});
	}, err => {
		if(err) console.error(err);
	});
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;


    return month + "/" + day + "/" + year + "," + hour + ":" + min + ":" + sec;
}

function botUptime(){
	var uptimeSeconds = 0, uptimeMinutes = 0, uptimeHours = 0, uptimeDays = 0;

	uptimeSeconds = Math.floor(bot.uptime/1000);

	if(uptimeSeconds > 60){
		uptimeMinutes = Math.floor(uptimeSeconds/60);
		uptimeSeconds = Math.floor(uptimeSeconds % 60);
	}

	if(uptimeMinutes > 60){
		uptimeHours = Math.floor(uptimeMinutes / 60);
		uptimeMinutes = Math.floor(uptimeMinutes % 60);
	}

	if(uptimeHours > 24){
		uptimeDays = Math.floor(uptimeHours / 24);
		uptimeHours = Math.floor(uptimeHours % 24);
	}

	return [uptimeDays, uptimeHours, uptimeMinutes, uptimeSeconds];
}

/*	Starts playing the first song(index) of the queue
*	After it has passed it checks to see if there is another in queue
*	If there are more songs in queue, the first song is removed after it has been played unless
*	it is set to loop, replay, or stopped
*/
function play(connection, message) {
	const song = queue[0];
	if(!fs.existsSync(song.file)){
		message.channel.send("**ERROR:** `" + queue[0].title + "` file not found. Skipping...");
		queue.shift();
	}

	botPlayback = connection.playFile(song.file)
		.on('end', ()=>{
			playing = false;

			if(!stopped){
				if(looping){
					queue.push(queue.shift());
				} else{
					if(!stayOnQueue){
						queue.shift();
					} else
						stayOnQueue = false;
				}

				if(queue.length > 0){
					play(connection, message);
				} else{
					setTimeout(()=>{
						removeTempFiles();
					}, 1500);
				}
			}
		})
		.on('error', (error)=>{
			sendError("Playback", error, message.channel);
		});
	botPlayback.setVolume(0.5);
	playing = true;
}

// Generate Invite link
function getInvite(callback){
	bot.generateInvite([
		"CONNECT", "SPEAK", "READ_MESSAGES", "SEND_MESSAGES", "SEND_TTS_MESSAGES",
		"ATTACH_FILES", "USE_VAD"
	]).then( link => {
		callback(link);
	});
}

function clearTemp(){
	fs.readdir(tempFilesPath, (error, files) =>{
		if(files.length > 0){
			async.each(files, (file, callback) =>{
				fs.unlinkSync(path.join(tempFilesPath, file));
				callback();
			}, ()=>{
				console.log("Temp Folder cleared");
			});
		}
	});

}

function isYTLink(input){
	/* YT REGEX : https://stackoverflow.com/questions/3717115/regular-expression-for-youtube-links
	*	by Adrei Zisu
	*/
	var YT_REG = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/

	return YT_REG.test(input);
}

bot.on('ready', () => {
	console.log("HathorBot V" + botVersion)
	console.log(bot.user.username + " (" + bot.user.id + ")");

	// display servers
	var guilds = [];
	bot.guilds.array().forEach( (guild) =>{
		guilds.push(guild.name);
	});

	if(guilds.length > 0){
		console.log("Servers:");
		console.log(guilds.join("\n"));
		console.log();
	}

	setGame(defaultGame);

	// Displays invite link if the bot isn't conntected to any servers
	if(bot.guilds.size === 0){
		getInvite(link =>{
			console.log("Invite this bot to your server using this link:\n"  + link);
		});
		console.log();
	}

	clearTemp();
});

bot.on('disconnect', (event) =>{
	console.log("Exited with code: " + event.code);
	if(event.reason)
		console.log("Reason: " + event.reason);

	removeTempFiles();
	process.exit(0);
});

bot.on('message', message => {
	// List admin groups that are allowed to use admin commands
	if(isCommand(message.content, 'listgroups')){
		if(isOwner(message) || isAdmin(message)){
			var list = [];
			for(var i = 0; i < adminRoles.length; i++){
				list.push("**"+(i+1) + "**. " + adminRoles[i]);
			}
			message.channel.send("**Admin Groups**", {
				embed: {
					description: list.join('\n'),
					color: 15158332
				}
			});
		}
	}

	// Command to add a certain group to use admin access
	if(isCommand(message.content, 'addgroup')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var group = message.content.split(' ');
				group.splice(0,1);
				group = group.join(" ");

				group = message.guild.roles.find( role => {
					return role.name.toLowerCase() === group.toLowerCase();
				});

				if(!group){
					message.channel.send("No group found");
					return;
				}else
					group = group.name.toLowerCase();

				fs.readFile(botPreferenceFile, (error, file) =>{
					if(error) return sendError("Reading Preference File", error, message.channel);

					try{
						file = JSON.parse(file);
					}catch(error){
						if(error) return sendError("Parsing Preference File", error, message.channel);
					}

					for(var i = 0; i < file.admingroups.length; i++){
						if(file.admingroups[i] === group)
							return message.channel.send("This group has already been added");
					}

					file.admingroups.push(group);

					adminRoles = file.admingroups;

					fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), error =>{
						if(error) return sendError("Writing to Preference File", error, message.channel);

						message.channel.send("Group `" + group + '` added');
					});
				});
			}
		} else message.channel.send("You do not have access to this command.");
	}

	// Remove a group from admin access
	if(isCommand(message.content, 'remgroup')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.lastIndexOf(' ') !== -1){
				var groupName = message.content.split(' ')[1].toLowerCase();

				for(var i = 0; i < adminRoles.length; i++){
					if(groupName === adminRoles[i]){
						adminRoles.splice(i, 1);

						fs.readFile(botPreferenceFile, (err, file)=>{
							if(err) return sendError("Reading Preference File", err, message.channel);

							try{
								file = JSON.parse(file)
							}catch(err){
								if(err) return sendError("Parsing Preference File", err, message.channel);
							}

							file.admingroups = adminRoles;

							fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), err =>{
								if(err) return sendError("Writing to Preference File", err, message.channel);
								message.channel.send("Group `" + groupName + "` has been removed.");
							});
						});
					}
				}
			}
		} else message.channel.send("You do not have access to this command.");
	}

	// Admin Commands
	if(isCommand(message.content, 'setusername')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var username = message.content.split(' ')[1];
				bot.user.setUsername(username);
				console.log("DISCORD: Username set to " + username);
			}
		} else message.channel.send("You do not have access to this command.");
	}

	if(isCommand(message.content, 'setavatar')){
		if(isOwner(message) || isAdmin(message)){
			if(message.content.indexOf(' ') !== -1){
				var url = message.content.split(' ')[1];
				bot.user.setAvatar(url);
				console.log("DISCORD: Avatar changed");
			}
		} else message.channel.send("You do not have access to this command.");
	}

  	if(isCommand(message.content, 'setgame') && isAdmin(message)){
  		if(isOwner(message) || isAdmin(message)){
				if(message.content.indexOf(' ') !== -1){
	  			var init = message.content.split(' ')[1];
	  			setGame(init);
	  		}
			} else message.channel.send("You do not have access to this command.");
  	}

  	if(isCommand(message.content, 'exit')){
  		if(isOwner(message) || isAdmin(message)){
				if(currentVoiceChannel)
	  			currentVoiceChannel.leave();
	  		bot.destroy();
			} else message.channel.send("You do not have access to this command.");
  	}

  	if(isCommand(message.content, 'setinit')){
  		if(isOwner(message) || isAdmin(message)){
				if(message.content.indexOf(' ') !== -1){
	  			var init = message.content.split(' ')[1];

	  			initcmd = init;

	  			fs.readFile(botPreferenceFile, (error, file) => {
	  				if(error) return sendError("Reading Preference File", error, message.channel);

	  				try{
	  					file = JSON.parse(file);
	  				}catch(error){
	  					if(error) return sendError("Parsing Preference File", error, message.channel);
	  				}

	  				file.initcmd = init;

	  				fs.writeFile(botPreferenceFile, JSON.stringify(file, null, '\t'), error =>{
	  					if(error) return sendError("Writing Preference File");

	  					message.channel.send("Command initializer set as `" + init + "`");
	  				});
	  			});
	  		}
			} else message.channel.send("You do not have access to this command.");
  	}
  	// -----------------------------------------------------------------------

  	if(isCommand(message.content, 'source')){
  		message.channel.send("**Source:** https://github.com/Mesmaroth/discord-HathorBot");
  	}

  	if(isCommand(message.content, 'report')){
  		if(message.content.indexOf(' ') !== -1){
  			var user = message.member.user.username;
  			var msg = message.content.split(' ');
  			var report;
  			var reportFile = path.join(logsPath, message.guild.id + '_reports');

  			msg.splice(0,1);
  			msg = msg.join(' ');
  			report = getDateTime() + " " + user + "@"+ message.guild.name + ": " + msg;

  			if(fs.existsSync(reportFile)){
  				fs.readFile(reportFile, 'utf-8', (error, file)=>{
  					if(error) return sendError("Reading Report File", error, message.channel);
  					file = file.split('\n');
  					file.push(report);
  					fs.writeFile(reportFile, file.join('\n'), error=>{
  						if(error) return sendError("Writing Report File", error, message.channel);
  						message.channel.send("Your report has been filed. Thank you");
  					});
  				});
  			}else{
  				fs.writeFile(reportFile, report, error =>{
  					if(error) return sendError("Writing Report File", error, message.channel);
  					message.channel.send("You're report has been filed. Thank you");
  				});
  			}
  			console.log("REPORT: " + user + " from " + message.guild.name + " submitted a report.");
  		} else{
  			message.channel.send("o_O ??");
  		}
  	}

		if(isCommand(message.content, 'reports')){
			if(isOwner(message) || isAdmin(message)){
				fs.readdir(logsPath, (error, files)=>{
					if(error) return sendError("Reading Logs Path", error, message.channel);

					for(var i = 0; i < files.length; i++){
						if(files[i].split('_')[0] === message.guild.id){
							fs.readFile(path.join(logsPath, files[i]),'utf-8', (error, file)=>{
								if(error) return sendError("Reading Report File", error, message.channel);

								// Clear the report once it's been read
								if(file === "") return message.channel.send("No reports available");

								message.channel.send("**Reports**", {
									embed: {
										color: 0xee3239,
										description: file
									}
								});
							});
							return;
						}
					}
					message.channel.send("No reports available");
				});
			} else message.channel.send("You do not have access to this command.");
		}

		if(isCommand(message.content, 'delreports')){
			if(isOwner(message) || isAdmin(message)){
				fs.readdir(logsPath, (error, files) => {
					if(error) return sendError('Reading Logs Path', error, message.channel);

					for(var i = 0; i < files.length; i++){
						if(files[i].split('_')[0] === message.guild.id){
							fs.unlink(path.join(logsPath, files[i]), error =>{
								if(error) return sendError("Unlinking log file", error, message.channel);
								message.channel.send("All reports have been deleted");
							});
							return;
						}
					}
					message.channel.send("No report file found");
				})
			} else message.channel.send("You do not have access to this command.");
		}

  	if(isCommand(message.content, 'stats')){
  		const users = bot.users.array();
  		const guildMembers = message.guild.members.array();
  		const channels = bot.channels.array();

  		var guildTotalOnline = 0;
  		var totalOnline = 0;
  		var totalTextChannels = 0;
  		var totalVoiceChannels = 0;
  		var uptime = botUptime();

  		for(var i = 0; i < guildMembers.length; i++){
  			if(guildMembers[i].presence.status === 'online'){
  				guildTotalOnline++;
  			}
  		}

  		for(var i = 0; i < users.length; i++){
  			if(users[i].presence.status === 'online'){
  				totalOnline++;
  			}
  		}
  		var nonGuildChannels = 0;
  		for(var i = 0; i < channels.length; i++){
  			if(channels[i].type === 'text')
  				totalTextChannels++
  			else if(channels[i].type === 'voice')
  				totalVoiceChannels++
  			else
  				nonGuildChannels++
  		}

	  	getInvite(link =>{
	  		message.channel.send("**Stats**",{
	  			embed: {
	  				author: {
				      name: bot.user.username,
				      url: link,
				      icon_url: bot.user.displayAvatarURL
				    },
	  				color: 1752220,
	  				fields: [{
	  					name: "Members",
	  					value: "`" + bot.users.size + "` Total\n`" + totalOnline + "` Online\n\n`" + message.guild.memberCount + "` total this server\n`" + guildTotalOnline + "` online this server",
	  					inline: true
	  				}, {
	  					name: "Channels",
	  					value: "`" + (bot.channels.size - nonGuildChannels)+ "` Total\n`" + message.guild.channels.size + "` this server\n`" + totalTextChannels + "` Total Text\n`" + totalVoiceChannels + "` Total Voice",
	  					inline: true
	  				}, {
	  					name: "Servers",
	  					value: bot.guilds.size,
	  					inline: true
	  				}, {
	  					name: "Uptime",
	  					value: uptime[0] + "d " + uptime[1] + "h " + uptime[2] + "m " + uptime[3] + "s",
	  					inline: true
	  				}],
	  				thumbnail: {
						url: bot.user.displayAvatarURL
					}
	  			}
	  		});
	  	});
  	}

  	if(isCommand(message.content, 'about')){
  		var owner = message.guild.members.find(member =>{
  			return member.user.username === "Mesmaroth"
  		});

  		if(owner){
  			owner = "<@" + owner.id + ">"
  		}else
  			owner = "Mesmaroth"

  		getInvite(link =>{
  			message.channel.send("**About**", {
	  			embed: {
	  				author: {
				      name: bot.user.username,
				      url: link,
				      icon_url: bot.user.displayAvatarURL
				    },
				    color: 10181046,
	  				fields: [{
	  					name: "Username",
	  					value: bot.user.username,
	  					inline: true
	  				},{
	  					name: "Version",
	  					value: "HathorBot v" + botVersion,
	  					inline: true
	  				},{
	  					name: "Author",
	  					value: "Robert (" + owner + ")",
	  					inline: true
	  				},{
	  					name: "Library",
	  					value: "Discord.js",
	  					inline: true
	  				},{
	  					name: "Source",
	  					value: "https://github.com/Mesmaroth/discord-HathorBot",
	  					inline: false
	  				}],
	  				thumbnail: {
						url: bot.user.displayAvatarURL
					}
	  			}
	  		});
  		});

  	}

  	if(isCommand(message.content, 'help')){
			if(message.content.indexOf(' ') !== -1){
				var prt = message.content.split(' ')[1];

				if(prt.toLowerCase() === 'admin'){
					message.channel.send("**Admin Commands**", {
						embed: {
							color: 1752220,
							description: "`" + initcmd + "setinit`: set initializer command to run commands\n"+
							"`" + initcmd + "listgroup`: list all groups that have admin access\n"+
							"`" + initcmd + "addgroup`: add a group to enable admin access\n"+
							"`" + initcmd + "remgroup`: removes a group from admin access\n"+
							"`" + initcmd + "setusername`: Set a username for the bot\n"+
							"`" + initcmd + "setavatar`: Set a avatar for the bot to use\n"+
							"`" + initcmd + "setgame`: Sets the name of the game the bot is playing\n"+
							"`" + initcmd + "setinit`: Sets the initial command\n"+
							"`" + initcmd + "reports`: View reports\n"+
							"`" + initcmd + "delreports`: Clear reports that have been read already\n"+
							"`" + initcmd + "exit`: Shutdown bot\n"
						}
					});
						return;
				}

				if(prt.toLowerCase() === 'general'){
					message.channel.send("**General Commands**", {
						embed: {
							color: 1752220,
							description: "`" + initcmd+ "about`: About this bot\n" +
							"`" + initcmd+ "stats`: View stats\n" +
							"`" + initcmd+ "report`: Report a problem\n" +
							"`" + initcmd+ "source`: Source link\n" +
							"`" + initcmd+ "uptime`: How long the bot has been up\n" +
							"`" + initcmd+ "invite`: Get invite link to your bot\n" +
							"`" + initcmd+ "setvc`: Set the defualt channel your bot joins when ever the bot connects\n" +
							"`" + initcmd+ "join`: Bot will attempt to join your channel\n"
						}
					});
						return;
				}

				if(prt.toLowerCase() === 'music'){
					message.channel.send("**Music Commands**", {
						embed: {
							color: 1752220,
							description: "`" + initcmd + "queue` or `playing`: To view all songs in queue\n" +
							"`" + initcmd + "play [YT_URL]`: Plays a song from a youtube link\n" +
							"`" + initcmd + "play [index_number]`: Plays a song from a file that has been saved to the bot\n" +
							"`" + initcmd + "play [search key term]`: Plays the first result of youtube search\n" +
							"`" + initcmd + "play [playlist name or index]`: Queues and plays all songs in a playlist\n" +
							"`" + initcmd + "play`: Plays song in queue if it has been stopped\n" +
							"`" + initcmd + "stop`: Stops the song\n" +
							"`" + initcmd + "skip`: Skips to the next song\n" +
							"`" + initcmd + "replay`: Stops and replays song from the start\n" +
							"`" + initcmd + "readd`: Adds the current song back into queue\n" +
							"`" + initcmd + "loop`: Loops the entire queue over and over, execute command to turn off\n" +
							"`" + initcmd + "local`: Displays all the songs saved by the bot\n" +
							"`" + initcmd + "remove [index_number]`: Removes a specific song from queue\n" +
							"`" + initcmd + "remove [#,#,#]`: Removes specific numbers seperated by commans in the queue\n" +
							"`" + initcmd + "save [YT_URL]`: Saves a song from youtube and stores it\n" +
							"`" + initcmd + "save`: Saves current song that's playing\n" +
							"`" + initcmd + "remlocal [index_number]`: Removes a song that has been saved locally\n" +
							"`" + initcmd + "playlist`: List all playlist\n" +
							"`" + initcmd + "playlist [playlist_index]`: List all songs of the playlist\n" +
							"`" + initcmd + "playlist save [PLAYLIST_NAME]`: Saves playlist\n" +
							"`" + initcmd + "playlist remove [playlist_index]`: Removes the playlist\n"+
							"`" + initcmd + "playlist remove [playlist_index] [track_index]`: Removes a track from a playlist specified\n"+
							"`" + initcmd + "playlist add [playlist_index] [YT_URL]`: Add a track to a playlist\n"+
							"`" + initcmd + "playlist rename [playlist_name or playlist_index] [new_playlist_name]`: Renames a playlist"
						}
					});
					return;
				}
			} else{
				message.channel.send("**Commands**", {
					embed: {
						color: 1752220,
						description: "**Admin Commands**\n" +
						"`" + initcmd + "help admin`: View Admin commands\n"+
						"`" + initcmd + "help general`: View General commands\n"+
						"`" + initcmd + "help music`: View Music Commands\n"
					}
				});
			}
  	}

  	if(isCommand(message.content, 'invite')){
  		getInvite(link => {
  			message.channel.send("**Invite:** "  + link);
  		});
  	}

  	if(isCommand(message.content, 'uptime')){
  		var uptime = botUptime();
  		var d = uptime[0], h = uptime[1], m = uptime[2], s = uptime[3];

  		message.channel.send("**Uptime:** " + d + " day(s) : " + h + " hours(s) : " + m + " minute(s) : " + s + " second(s)");
  	}

  	if(isCommand(message.content, 'setvc')){
  		if(message.content.indexOf(" ") !== -1){
  			var voiceChannelName = message.content.split(" ")[1];

  			var guild = message.member.guild;
  			var channel = getChannelByString(guild, voiceChannelName);

  			function writeOutChannels(){
  				fs.writeFile(defaultChannelPath, JSON.stringify(defaultChannel, null, '\t'), () =>{
		  			message.channel.send("Server default voice channel set to " + voiceChannelName);
		  		});
  			}

  			if(channel){
  				defaultChannel.name = voiceChannelName;
				defaultChannel.guild = guild.name;
				defaultChannel.voiceID = channel.id;
				defaultChannel.guildID = guild.id;
				writeOutChannels();
  			} else
  			  	message.channel.send("No voice channel found");
  		}
  	}

  	if(isCommand(message.content, 'join')){
  		var userVoiceChannel = message.member.voiceChannel;
  		if(userVoiceChannel){
  			if(!playing){
  				if(currentVoiceChannel){
	  				currentVoiceChannel.leave();
	  				currentVoiceChannel = null;
	  			 }
  				userVoiceChannel.join();
  				currentVoiceChannel = userVoiceChannel;
		  	} else
		  		message.channel.send("Currently playing something");
  		}
  		else
  			message.channel.send("You are not in a voice channel.");
  	}

  	if(isCommand(message.content, 'queue') || isCommand(message.content, 'playing') || isCommand(message.content, 'q')){
  		var songs = [];
  		for (var i = 0; i < queue.length; i++) {
  			songs.push(queue[i].title);
  		}

  		if(songs.length > 0){
  			if(songs.length === 1){
  				if(looping){
  					message.channel.send("**Queue - Playlist\t[LOOPING]**\n**Playing:** " + songs[0]);
  				} else
  					message.channel.send("**Queue - Playlist**\n**Playing:** " + songs[0]);
  			} else{
  				var firstSong = songs.shift();
  				for (var i = 0; i < songs.length; i++) {
  					songs[i] = "**" + (i+1) + ". **"+ songs[i];
  				}
  				if(looping){
  					message.channel.send("**Queue - Playlist\t[LOOPING]**\n**Playing:** " + firstSong + "\n\n" + songs.join("\n"));
  				} else
  					message.channel.send("**Queue - Playlist**\n**Playing:** " + firstSong + "\n\n" + songs.join("\n"));
  			}
  		} else
  			message.channel.send("No songs queued");
  	}

  	if(isCommand(message.content, 'local') || isCommand(message.content, 'l')){
  		fs.readdir(localPath, (error, files) =>{
  			if(error) return sendError("Reading Local directory", error, message.channel);
  			for(var i = 0; i < files.length; i++){
  				files[i] = "**" + (i+1) + ".** " + files[i].split(".")[0];
  			}

  			message.channel.send("**Local Songs**", {
  				embed: {
  					color: 10181046,
  					description: files.length > 0 ? files.join("\n") : "No Local files found"
  				}
  			});
  		});
  	}

  	if(isCommand(message.content, 'play') || isCommand(message.content, 'p')){
  		var file = message.attachments.first();

  		// Handle playing audio for a single channel
  		if(playing && currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Currently playing something in another voice channel");
			return;
		}

		if(!message.member.voiceChannel){
			message.channel.send("You aren't in a voice channel");
			return;
		}

		if(currentVoiceChannel !== message.member.voiceChannel){
			if(currentVoiceChannel) currentVoiceChannel.leave();

			currentVoiceChannel = message.member.voiceChannel;
			if(playing){
				message.channel.send("Currently playing something");
				return;
			}
		}

		function pushPlay(title, fPath, local, id, URL){
			if(id && URL){
				queue.push({
			 		title: title,
			 		id: id,
			 		file: fPath,
			 		local: local,
			 		url: URL
			 	});
			} else if(!id && !URL){
				queue.push({
			 		title: title,
			 		file: fPath,
			 		local: local
			 	});
			}

		 	if(!playing){
		 		message.channel.send("**Playing:** " + title);
		 		currentVoiceChannel.join().then( connection => {
					voiceConnection = connection;
					play(connection, message);
				});
		 	} else{
		 		message.channel.send("**Added to Queue:**\n" + title);
		 	}
		}

		// Play audio by file
		if(file){
			if(stopped){
				stopped = false;
	  			stayOnQueue = false;
	  			queue.splice(0,1);
	  	}

			var ext = file.filename.split('.');
			ext = ext[ext.length - 1];
			if(ext !== 'mp3'){
				message.channel.send("Mp3 files accepted only");
				return;
			}

			var fileName = file.filename.replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'');
			var filePath = path.resolve(tempFilesPath, fileName);
			var title = fileName.slice(0, fileName.lastIndexOf('.'));

			if(fs.existsSync(filePath)){
				pushPlay(title, filePath, false);
			 } else{
			 	var stream = request.get(file.url);

				stream.on('error', error => {
					if(error) return sendError("Getting Sound File", error, message.channel);
				});

				stream.pipe(fs.createWriteStream(filePath));

				stream.on('complete', () =>{
					pushPlay(title, filePath, false);
				});
			}
		} else if(message.content.indexOf(' ') !== -1){
			var input = message.content.split(' ')[1];
			var qUrl = URL.parse(input, true);
			var isLink = isYTLink(input);

			if(stopped){
				stopped = false;
	  			stayOnQueue = false;
	  			queue.splice(0,1);
	  		}

			// Play audio by non-youtube url link
			if( qUrl.hostname !== null && qUrl.hostname !== "www.youtube.com" && qUrl.hostname !== "youtu.be"){
				if(input.endsWith('.mp3')){
					var file = input.slice(input.lastIndexOf('/') + 1).replace(/[&\/\\#,+()$~%'":*?<>{}|_-]/g,'');
					var filePath = path.join(tempFilesPath, file);
					var title = file.slice(0, file.lastIndexOf('.'));

					if(fs.existsSync(filePath)){
						pushPlay(title, filePath, false);
					 } else{
					 	var stream = request.get(input);

					 	stream.on('response', response =>{
					 		if(response.statusCode === 404){
					 			message.channel.send("No file found with that address make sure it's a direct link to the file");
					 		}else{
					 			stream.pipe(fs.createWriteStream(filePath));
					 		}
					 	});

						stream.on('error', error => {
							if(error) return sendError("Getting Sound File", error, message.channel);
						});

						stream.on('complete', () =>{
							if(fs.existsSync(filePath)){
								pushPlay(title, filePath, false);
							}
						});
					}
				} else
					message.channel.send("No file found. Make sure it's a direct link to the file");
			} else if(isLink){ 
				// Play audo by YTURL
				var url = message.content.split(' ')[1];
				yt.getInfo({url: url, temp: tempFilesPath})
				.then(song => {
					yt.getFile({url: url, path: song.path})
					.then(() => {
						pushPlay(song.title, song.path, false, song.id, url);
					})
					.catch( err => {
						throw err
					})					
				})
				.catch(err => {
					if(err) sendError("Youtube Request", err, message.channel);
				})
			} else{
				// Play audio file by index number
				var indexFile = message.content.split(' ')[1];
				if(isNumber(indexFile)){
					indexFile = Number(indexFile);
					fs.readdir(localPath, (error, files) =>{
						if(error) return sendError("Reading local", error, message.channel);
						for(var i = 0; i < files.length; i++){
							if( indexFile === (i+1)){
								var title = files[i].split('.')[0];
								var file = path.join(localPath, files[i]);

								pushPlay(title, file, true);
								return;
							}
						}
						message.channel.send("No local song found with that index.");
					});
				} else{
					input = message.content.split(' ');
					input.shift();

					// Playing a playlist
					if(input[0] === 'playlist' || input[0] === 'pl'){
						var pl = input[1];
						fs.readdir(playlistPath, (error, files) =>{
							if(error) return sendError("Reading Playlist Path", error, message.channel);

							if(isNumber(pl)){
								pl = Number(pl);
							} else
								pl = pl.toLowerCase();

							async.eachOf(files, (file, index, callback)=>{
								if((index+1) === pl || files[index].split('.')[0].toLowerCase() === pl){
									try{
										var playlist = fs.readFileSync(path.join(playlistPath, files[index]));
										playlist = JSON.parse(playlist);
									}catch(error){
										if(error) return sendError("Parsing Playlist File", error, message.channel);
									}

									message.channel.send("Loading `" + files[index].split('.')[0] + '` playlist onto queue');

									async.eachSeries(playlist, (song, callback) =>{
										var title = song.title;
										var URL = song.url;
										var id = song.id;
										var local = song.local;

										if(song.local){
											queue.push({
												title: title,
												file: song.file,
												local: true
											});

											if(queue.length === 1){
												if(!playing){
											 		message.channel.send("**Playing:** " + title);
											 		currentVoiceChannel.join().then( connection => {
														voiceConnection = connection;
														play(connection, message);
													});
											 	}
											}
										} else{
											yt.getInfo(URL, (error, rawData, id, title, length_seconds) =>{
												if(error) return callback(error);
												var filePath = path.join(tempFilesPath, id + '.mp3');

												yt.getFile(URL, filePath, ()=>{
													queue.push({
														title: title,
														file: filePath,
														id: id,
														url: URL,
														local: false
													});

													if(queue.length === 1){
														if(!playing){
													 		message.channel.send("**Playing:** " + title);
													 		currentVoiceChannel.join().then( connection => {
																voiceConnection = connection;
																play(connection, message);
															});
													 	}
													}
												});
											});
										}
										callback(null);
									}, err =>{
										if(err) return sendError("Youtube Request", err, message.channel);
									});
								}
							}, err=>{
								if(err) return sendError(err, err, message.channel);
							});
						});
					}else{
						//	Play Youtube by search
						input = input.join();						
						yt.search(input).then(searchResults => {
							var song = {}
							if(searchResults.length === 0){
								message.channel.send("Couldn't find what you were looking for.");
								return;
							}
							song.id = searchResults[0].id;
							song.title = searchResults[0].title;
							song.url = searchResults[0].url;
							song.path = path.join(tempFilesPath, searchResults[0].id + '.mp3' );
							
							yt.getFile({url: song.url, path: song.path}).then(() =>{
								pushPlay(song.title, song.path, false, song.id, song.url);
							}).catch(err => {
								throw err
							});
						}).catch(err => {
							if(err) sendError('Youtube Request', err, message.channel);
						});
					}
				}
			}
  		} else{
  			if(queue.length > 0){
  				if(!playing){
  					currentVoiceChannel.join().then( connection => {
  						voiceConnection = connection;
  						play(voiceConnection, message);
  					});
  				} else
  					message.channel.send("Already playing something");
  			}
  			else
  				message.channel.send("No songs queued");
  		}
  	}

  	if(isCommand(message.content, 'stop')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

  		if(playing){
  			playing = false;
  			stayOnQueue = true;
  			stopped = true;
  			botPlayback.end();
  		} else
  			message.channel.send("Nothing to stop");
  	}

  	if(isCommand(message.content, 'skip')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

  		if(playing){
  			var prevSong = queue[0].title;
  			playing = false;
  			stayOnQueue = false;
  			botPlayback.end();
  			if(queue.length > 0)
  				message.channel.send("**Skipped:** " + prevSong + "\n**Playing:** " + queue[0].title);
  			else
  				message.channel.send("**Skipped:** " + prevSong);
  		} else{
  			if(queue.length > 0){
  				var prevSong = queue[0].title;

  				if(stayOnQueue)
  					stayOnQueue = false;
  				queue.shift();
  				message.channel.send("**Skipped:** " + prevSong + "\n**Playing:** " + queue[0].title);
  				play(voiceConnection, message);
  			} else{
  				message.channel.send("Nothing to skip");
  			}
  		}
  	}

  	if(isCommand(message.content, 'replay')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

  		if(playing){
  			playing = false;
  			stayOnQueue = true;
  			botPlayback.end();
  		} else
  			message.channel.send("Need to be playing something to replay");
  	}

  	if(isCommand(message.content, 'remove')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

  		if(message.content.indexOf(' ') !== -1){
  			var param = message.content.split(' ')[1];

  			if(param === "all"){
  				if(!playing){
  					queue = [];
  					removeTempFiles();
  				} else{
  					queue.splice(1, queue.length - 1);
  				}
  				message.channel.send("All songs have been removed from queue");
  				return;
  			}

  			if(param.indexOf(',') !== -1){
  				param = param.split(',');
  			}else{
  				param = [param];
  			}
  			for(var i = 0; i < param.length; i++){
  				if(isNumber(param[i])){
  					param[i] = Number(param[i]);
  				}else{
  					message.channel.send("One of your parameters is not a number. Please try again");
  					return;
  				}
  			}

  			var list = [];
  			for(var x = 0; x < param.length; x++){
  				for(var y = 1; y < queue.length; y++){
  					if(param[x] === y){
  						list.push(queue[y]);
  					}
  				}
  			}

  			for(var i = 0; i < list.length; i++){
  				for(var x = 1; x < queue.length; x++){
  					if(list[i].title === queue[x].title){
  						var title = queue[x].title;
						queue.splice(x, 1);
						message.channel.send("**Removed:** `" + title + "` from queue");
  					}
  				}
  			}
  		}
  	}

  	if(isCommand(message.content, 'save')){
	  	if(message.content.indexOf(' ') !== -1){
			var url = message.content.split(' ')[1];
			yt.getInfo({url: url, local: localPath})
			.then(song => {
				song.title = song.title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g,'');
				yt.getFile(song)
				.then(song => {
				message.channel.send("**Saved:** *" + song.title + "*");
				})
			})
			.catch(err => {
				if(err) sendError("Youtube Info", error, message.channel);
			});
	  	}
	  	else{
	  		if(playing){
	  			var song = queue[0];
		  		var title = song.title.replace(/[&\/\\#,+()$~%.'":*?<>{}|]/g,'');
			  	var output = './local/' + title + '.mp3';
	  			if(!song.local){
		  			if(!fs.existsSync(output)){
		  				fs.createReadStream(song.file).pipe(fs.createWriteStream(output));
		  				message.channel.send("**Saved:** *" + title + "*");
		  			} else{
		  				message.channel.send("You already saved this song")
		  			}
		  		} else{
		  			message.channel.send("You already saved this song");
		  		}
	  		} else{
	  			message.channel.send("Not playing anything to save");
	  		}
	  	}
  	}

  	if(isCommand(message.content, 'remlocal')){
  		var index = Number(message.content.split(' ')[1]);

  		fs.readdir(localPath, (error, files) =>{
  			if(error) return sendError("Remove Local", error, message.channel);
  			for (var i = 0; i < files.length; i++) {
	  			if((i+1) === index){
	  				if(!playing){
	  					fs.unlinkSync(path.join(localPath, files[i]));
	  					message.channel.send("Removed " + files[i].split('.')[0]);
	  					return;
	  				} else{
	  					if(files[i] !== queue[0].title + '.mp3'){
	  						fs.unlinkSync(path.join(localPath, files[i]));
	  						message.channel.send("Removed " + files[i].split('.')[0]);
	  						return;
	  					}
	  				}
	  			}
  			}
  			message.channel.send("No local file found with that index.");
  		});
  	}

  	if(isCommand(message.content, 'readd')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

  		if(queue.length > 0){
  			var newSong = queue[0];
			queue.push(newSong);
			message.channel.send("**Readded to Queue** " + newSong.title);
  		} else
  			message.channel.send("No song queued to re-add.");
  	}

  	if(isCommand(message.content, 'loop')){
  		if(currentVoiceChannel !== message.member.voiceChannel){
			message.channel.send("Not in the bot's voice channel");
  			return;
  		}

	  	if(!looping){
	  		looping = true;
	  		message.channel.send("Looping `ON`");
	  	} else{
	  		looping = false;
	  		message.channel.send("Looping `OFF`");
	  	}
  	}

  	if(isCommand(message.content, 'playlist') || isCommand(message.content, 'pl')){
  		if(message.content.indexOf(' ') !== -1){
  			var param = message.content.split(' ')[1];

  			if(isNumber(param)){
  				param = Number(param);
  				fs.readdir(playlistPath, (error, files) => {
  					if(error) return sendError("Reading Playlist Directory", error, message.channel);

  					for(var i = 0; i < files.length; i++){
  						if((i+1) === param){
  							try{
								var playlist = fs.readFileSync(path.join(playlistPath, files[i]));
								var playlist = JSON.parse(playlist);
  							}catch(error){
  								if(error) return sendError("Reading Playlist File", error, message.channel);
  							}

  							var playlistTitle = files[i].split('.')[0];
							var songs = [];

							for(var i = 0; i < playlist.length; i++){
								songs.push("**" + (i+1) + ".** " + playlist[i].title);
							}

							message.channel.send("**Playlist - " + playlistTitle + "**\n" + songs.join("\n"));
  						}
  					}
  				});
  			} else{
  				if(param.toLowerCase() === 'save'){
  					if(message.content.indexOf(' ', message.content.indexOf('save')) !== -1){
  						var playlistName = message.content.split(' ');
  						playlistName.splice(0,2);
  						playlistName = playlistName.join(' ');
  						var playlist = [];

  						if(queue.length === 0)
  							return message.channel.send("No songs in queue to save from");

  						for(var i = 0; i < queue.length; i++){
  							if(queue[i].local){
  								playlist.push({
  									title: queue[i].title,
  									file: queue[i].file,
  									local: queue[i].local
  								});
  							} else{
  								playlist.push({
  									title: queue[i].title,
  									url: queue[i].url,
  									id: queue[i].id,
  									local: false
  								});
  							}
  						}

  						fs.readdir(playlistPath, (error, files) =>{
  							if(error) return sendError("Readding Playlist Path", error, message.channel);

  							for(var i = 0; i < files.length; i++){
  								var fileName = files[i].split('.')[0];
  								if(fileName.toLowerCase() === playlistName.toLowerCase()){
  									message.channel.send("There is a playlist with this name already");
  									return;
  								}
  							}

  							fs.writeFile(path.join(playlistPath, playlistName + '.json'), JSON.stringify(playlist, null, '\t'), error =>{
	  							if(error) return sendError("Writing Playlist File", error, message.channel);
	  							message.channel.send("Playlist `" + playlistName + '` saved');
	  						});
  						});
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'remove'){
  					if(message.content.indexOf(' ', message.content.indexOf('remove')) !== -1){
  						var playlistIndex = message.content.split(' ')[2];
  						var trackIndex = message.content.split(' ')[3];

  						if(!isNumber(playlistIndex)){
  							message.channel.send('Please enter a playlist index number')
  							return;
  						} else playlistIndex = Number(playlistIndex);

  						if(trackIndex){
  							if(isNumber(trackIndex)){
  								trackIndex = Number(trackIndex);
  								fs.readdir(playlistPath, (error, files) =>{
  									if(error) return sendError("Reading Playlist Path", error, message.channel);
  									for(var i = 0; i < files.length; i++){
  										if((i+1) === playlistIndex){
  											var playlistFile = files[i];
  											var playlistFileName = files[i].split('.')[0];

  											fs.readFile(path.join(playlistPath, playlistFile), (error, file)=>{
  												try{
  													file = JSON.parse(file);
  												} catch(error){
  													if(error) return sendError("Parsing Playlist File", error, message.channel);
  												}

  												if(trackIndex > file.length || trackIndex <= 0){
  													return message.channel.send('Please enter a correct index track number')
  												}

  												var titleTrack = file[trackIndex-1].title;
  												file.splice(trackIndex - 1, 1);
  												if(file.length === 0){
  													message.channel.send("Please consider removing the playlist instead.");
  													return;
  												}
  												fs.writeFile(path.join(playlistPath, playlistFile), JSON.stringify(file, null, '\t'), error =>{
  													if(error) return sendError("Writing to Playlist File", error, message.channel);
  													message.channel.send('**Playlist**\nTrack `' + titleTrack +  '` has been remove from `' + playlistFileName + '` playlist')
  												});
  											});
  										}
  									}
  								});
  							} else{
  								message.channel.send('Please enter a track index number in a playlist');
  								return;
  							}
  							return;
  						}

  						fs.readdir(playlistPath, (error, files) => {
  							if(error) return sendError("Reading Playlist Path", error, message.channel);
  							for(var i = 0; i < files.length; i++){
  								if((i+1) === playlistIndex){
  									var title = files[i].split('.')[0];
  									fs.unlink(path.join(playlistPath, files[i]), error =>{
  										if(error) return sendError("Unlinking Playlist File", error, message.channel);
  										message.channel.send("Playlist `" + title + "` removed");
  									});
  									return;
  								}
  							}
  							message.channel.send("No playlist found");
  						});
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'add'){
  					if(message.content.indexOf(' ', message.content.indexOf('add')) !== -1){
  						var playListIndex = message.content.split(' ')[2];
  						var link = message.content.split(' ')[3];

  						if(isNumber(playListIndex)){
  							playListIndex = Number(playListIndex);
  							if(link){
  								if(!isYTLink(link)){
  									message.channel.send("You did not enter a valid youtube url");
  									return;
  								}

  								fs.readdir(playlistPath, (err, files) =>{
  									if(err) return sendError("Reading Directory", err, message.channel);
  									async.eachOf(files, (file, index) =>{
  										if((index + 1) === playListIndex){
  											fs.readFile(path.join(playlistPath, file), (err, pl) =>{
  												if(err) return sendError("Reading File", err, message.channel);
  												try{
  													pl = JSON.parse(pl);
  												} catch(err){
  													if(err) return sendError("Parsing File", err, message.channel);
  												}

  												yt.getInfo(link, (error, rawData, id, title) =>{

  													async.each(pl, (song, callback) =>{
	  													if(song.id === id || song.url === link || song.title === title){
	  														callback(new Error("Already in playlist"));
	  													} else {
	  														callback(null);
	  													}
	  												}, err =>{
	  													if(err) return sendError(err, err, message.channel);

	  													pl.push({
	  														title: title,
	  														id: id,
	  														url: link,
	  														local: false
	  													});

	  													fs.writeFile(path.join(playlistPath, file), JSON.stringify(pl, null, '\t'), err =>{
	  														if(err) return sendError("Writing Playlist File", err, message.channel);

	  														message.channel.send("*" + title +"*\n has been added to `" + file.split('.')[0] + "` playlist");
	  													});
	  												});


  												});

  											});
  										}
  									});
  								});
  							}else {
  								message.channel.send("No URL provided please try again");
  							}
   						} else{
  							message.channel.send("No index specified. Try again");
  						}
  					}
  					return;
  				}

  				if(param.toLowerCase() === 'rename'){
  					if(message.content.indexOf(' ', message.content.indexOf('rename')) !== -1){
  						var playlistName = message.content.split(' ')[2];
  						var newPlaylistName = message.content.split(' ')[3];

  						if(!newPlaylistName){
  							message.channel.send("No playlist name was specified");
  							return;
  						}

  						if(isNumber(playlistName)){
  							playlistName = Number(playlistName);
  						}

  						var e = /^[a-zA-Z0-9_]*$/;
  						if(!e.test(newPlaylistName)){
  							message.channel.send("No symbols allowed! Use alpha, numeric, or underscore characters only");
  							return;
  						}

  						fs.readdir(playlistPath, (err, files) =>{
  							if(err) return sendError("Reading Playlist Path", err, message.channel);

  							for(var i = 0; i < files.length; i++){
  								if(files[i].split('.')[0].toLowerCase() === (isNumber(playlistName) ? playlistName : playlistName.toLowerCase()) || (playlistName - 1) === i){
  									var oldPlPath = path.join(playlistPath, files[i]);
  									var newPlPath = path.join(playlistPath, newPlaylistName + '.json');
  									fs.rename(oldPlPath, newPlPath, (err)=>{
  										if(err) return sendError("Renaming Playlist File", err, message.channel);
  										message.channel.send("Playlist `" + files[i].split('.')[0] + "` has been renamed to `" + newPlaylistName + "`");
  									});
  									return;
  								}
  							}
  							message.channel.send("Playlist `" + files[i].split('.')[0] + "` not found");
  						});
  					} else{
  						message.channel.send("No name specified");
  					}
  				}
  			}
  		} else {
  			fs.readdir(playlistPath, (error, files) =>{
  				if(error) return sendError("Reading Playlist Directory", error, message.channel);
  				for(var i = 0; i < files.length; i++){
  					files[i] = "**" + (i+1) + ".** " + files[i].split('.')[0];
  				}

  				if(files.length > 0)
  					message.channel.send("**Playlist**\n" + files.join("\n"));
  				else {
  					message.channel.send("No Playlist saved");
  				}
  			});
  		}
  	}
});

bot.on('voiceStateUpdate', (oldMember, newMember) =>{
	if(newMember.id === bot.user.id){
		newMember.voiceChannel = currentVoiceChannel;
	}

	if(currentVoiceChannel && oldMember.voiceChannel){
		if(oldMember.voiceChannel === currentVoiceChannel && newMember.voiceChannel !== currentVoiceChannel  && currentVoiceChannel.members.size === 1){
			if(queue.length > 0){
				queue.splice(0, queue.length);
			}

			if(playing){
				botPlayback.end();
				playing = false;
				stopped = false;
				looping = false;
				stayOnQueue = false;
			}

			currentVoiceChannel.leave();
		}
	}
});

bot.login(botLogin.token);
