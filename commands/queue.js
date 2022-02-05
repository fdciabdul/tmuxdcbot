const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { titleCase } = require('./../util.js');

const name = 'queue';
const description = 'Displays the queue.';
const aliases = ['q'];
const operatorOnly = false;
const maxSongs = 10;

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

        const embed = new MessageEmbed()
            .setColor('FFA500')
            .setTitle(`${interaction.getGuildName()}`);
    
        queue = audioPlayer.songHandler.queue;
        pool = audioPlayer.songHandler.pool;

        j = 0;

        if (queue.isEmpty()) {

            if (pool == null || pool.isEmpty()) {
                embed.setDescription('Hmm, this seems to be empty.');
            }

        }

        else {

            queueName = `Queue:`
            queueSongs = queue.getSongList();

            queueValue = '';
            for (i = 0; i < queueSongs.length && j < maxSongs; i++) {
                queueSong = queueSongs[i];
                queueValue = queueValue + `**${j+1}.** [${queueSong.title}](${queueSong.url})\n`;
                j++;
            }

            embed.addField(queueName, queueValue, false);

        }

        if (pool != null) {

            if (!pool.isEmpty() && j < maxSongs) {

                poolName = `Current Pool: ${titleCase(pool.name)}`;
                poolSongs = pool.getSongList();

                poolValue = '';
                for (i = 0; i < poolSongs.length && j < maxSongs; i++) {
                    poolSong = poolSongs[i];
                    poolValue = poolValue + `**${j+1}.** [${poolSong.title}](${poolSong.url})\n`;
                    j++;
                }

                embed.addField(poolName, poolValue, false);

            }

        }

        interaction.send({embeds: [embed]});

	}

};