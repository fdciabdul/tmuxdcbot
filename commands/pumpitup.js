const { SlashCommandBuilder } = require('@discordjs/builders');
const { titleCase } = require('../util.js');
const ytpl = require('ytpl');

const name = 'pumpitup';
const description = 'Stops whatever you are playing and plays Pump it Up on repeat!';
const aliases = ['pump'];
const operatorOnly = false;

module.exports = {

    name: name,
    description: description,
    aliases: aliases,
	operatorOnly: operatorOnly,

	data:   [
                new SlashCommandBuilder()
			    .setName(name)
			    .setDescription(description)
            ],

	async execute(interaction, command, args, client, user, audioPlayerManager) {

        if (command == 'pump') {

            if (args < 2) {
                return;
            }

            if (args[0].toLowerCase() != 'it' || args[1].toLowerCase() != 'up') {
                return
            }

        }

        channel = interaction.getVoiceChannel();

        if (channel == null) {
            interaction.send('🚫 **|** To use this command, I must be in a voice channel!');
            return;
        }   

        guildId = interaction.getGuildId();

        // Create a new audio player if one doesn't exist.
        if (!audioPlayerManager.hasPlayer(guildId)) {
            audioPlayerManager.createPlayer(guildId, channel, interaction);
        } 
        
        // Update the channel and interaction objects in the audio player if it exists.
        else {
            audioPlayerManager.updatePlayer(guildId, channel, interaction);
        }

        audioPlayer = audioPlayerManager.getPlayer(guildId);


        url = "https://www.youtube.com/watch?v=BfnjX88Va4Y&ab_channel=DefectedRecords";

        if (audioPlayer.isPlaying) {
            audioPlayer.clearQueue();
            await audioPlayer.addSong(url);
            audioPlayer.setRepeat(false);
            audioPlayer.skip();
            audioPlayer.setRepeat(true);
        }

        else {
            await audioPlayer.addSong(url);
            audioPlayer.setRepeat(true);
        }

	}

};