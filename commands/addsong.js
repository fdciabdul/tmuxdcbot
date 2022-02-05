const { SlashCommandBuilder } = require('@discordjs/builders');
const { titleCase } = require('./../util.js');

const name = 'addsong';
const description = 'Add songs to pools!';
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
                    .setDescription("Enter a pool name to add a song to.")
                    .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("query")
                    .setDescription("Enter search terms or a YouTube URL.")
                    .setRequired(true)
                )
            ],

	async execute(interaction, command, args, client, user, audioPlayerManager) {

        const id = user.id;

        if (args.length < 1) {
            interaction.send('🚫 **|** Not enough arguments! Please specify a song pool to add a song in');
            return;
        }

        if (args.length < 2) {
            interaction.send('🚫 **|** Not enough arguments! To add a song please enter some search terms or a YouTube link');
            return;
        }

        interaction.defer();

        poolName = user.getPoolNameFromArgs(args);
        
        if (poolName == null) {
            interaction.send(`🚫 **|** Pool could not be found`);
            return;
        }

        pool = user.getPool(poolName);
        for (i = 0; i < poolName.split(/\s+/).length; i++) {
            args.shift();
        }

        if (await pool.hasSong(args)) {

            song = await pool.getSong(args)
            title = song.title;

            interaction.send(`🚫 **|** Song "${title}" is already in pool "${titleCase(poolName)}`);
            return;
        }

        await pool.addSong(args);

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
        user.save();

        interaction.send(`✅ **|** Song **${title}** was successfully added to pool **${titleCase(poolName)}**`);

	}

};