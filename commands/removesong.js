const { SlashCommandBuilder } = require('@discordjs/builders');
const { titleCase } = require('./../util.js');

const name = 'removesong';
const description = 'Remove songs from existing pools!';
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
                .addStringOption(option =>
                    option.setName("pool")
                    .setDescription("Enter a pool name that you wish to remove a song from.")
                    .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("query")
                    .setDescription("Enter search terms or a YouTube URL for the song name.")
                    .setRequired(true)
                )
            ],

	async execute(interaction, command, args, client, user, audioPlayerManager) {

        const id = user.id;

        if (args.length < 1) {
            interaction.send('🚫 **|** Not enough arguments! Please specify a song pool to remove a song from');
            return;
        }

        if (args.length < 2) {
            interaction.send('🚫 **|** Not enough arguments! To remove a song please enter some search terms or a YouTube link');
            return;
        }

        interaction.defer();

        poolName = user.getPoolNameFromArgs(args);
        pool = user.getPool(poolName);

        if (pool == null || poolName == null) {
            interaction.send(`🚫 **|** Pool could not be found`);
            return;
        }

        for (i = 0; i < poolName.split(/\s+/).length; i++) {
            args.shift();
        }

        if (!(await pool.hasSong(args))) {
            interaction.send(`🚫 **|** Song requested is not in pool **${titleCase(poolName)}**`);
            return;
        }

        song = await pool.getSong(args)
        
        if (song == null) {
            interaction.send(`🚫 **|** Something went wrong. Song could not be found.`);
            return;
        }

        if (typeof song === "undefined") {
            interaction.send(`🚫 **|** Something went wrong. Song could not be found.`);
            return;
        }

        title = song.title;

        await pool.removeSong(args);
        user.save();

        interaction.send(`🗑️ **|** Song **${title}** was successfully removed from pool **${titleCase(poolName)}**`);

	}

};