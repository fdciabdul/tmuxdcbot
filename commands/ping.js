const { SlashCommandBuilder } = require('@discordjs/builders');

const name = 'ping';
const description = 'Replies with Pong';
const aliases = [];
const operatorOnly = false;

module.exports = {

    name: name,
    description: description,
    aliases: aliases,
	operatorOnly: operatorOnly,

	data: 	[
				new SlashCommandBuilder()
				.setName(name)
				.setDescription(description)
			],

	async execute(interaction, command, args, client, userData, audioPlayerManager) {
		interaction.send('👋 **|** Pong!');
	}

};