const { SlashCommandBuilder } = require('@discordjs/builders');

const name = 'nowplaying';
const description = 'Get the name of the song currently playing.';
const aliases = ['np','currentsong'];
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

        channel = interaction.getVoiceChannel();

        if (channel == null) {
            interaction.send('🚫 **|** To use this command, I must be in a voice channel!');
            return;
        }   

        guildId = interaction.getGuildId();

        // See if an audio player has been created for the channel.
        if (!audioPlayerManager.hasPlayer(guildId)) {
            interaction.send('🚫 **|** To use this command, I must be in a voice channel!');
            return;
        } 
        
        // Update the channel and interaction objects in the audio player if it exists.
        else {
            audioPlayerManager.updatePlayer(guildId, channel, interaction);
        }

        audioPlayer = audioPlayerManager.getPlayer(guildId);
        currentSong = audioPlayer.getCurrentSong();

        if (currentSong == null) {
            interaction.send('🚫 **|** No songs are currently playing!');
        }

        interaction.send(`🎵 **|** Now playing: **${currentSong.title}**`);

	}

};