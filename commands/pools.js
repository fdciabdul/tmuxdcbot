const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { titleCase } = require('./../util.js');

const name = 'pools';
const description = 'List all the pool on your profile!';
const aliases = [];
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

        const embed = new MessageEmbed()
            .setColor('FFA500')
            .setTitle(`${interaction.getUsername()}'s Song Pools`);

        pools = user.pools;

        if (pools.length == 0) {
            embed.setDescription('Hmm, you have no song pools.');
        }

        else {

            list = '';
            for (i = 0; i < pools.length; i++) {
                pool = pools[i];
                list = list + ` - **${titleCase(pool.name)}** *(${pool.songs.length} songs)*\n`;
            }

            embed.setDescription(list);

        }

        interaction.send({embeds: [embed]});

	}

};