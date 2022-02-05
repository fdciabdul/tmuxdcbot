const { SlashCommandBuilder } = require('@discordjs/builders');

const name = 'clear';
const description = 'Clears the current queue.';
const aliases = ['clearqueue'];
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
        audioPlayer.clearQueue();

	}

};