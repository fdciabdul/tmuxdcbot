const ytpl = require('ytpl');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Pool } = require('../classes/pool.js');
const { titleCase } = require('../util.js');

const name = 'addpool';
const description = 'Create a new song pool for your profile!';
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
                    .setDescription("Enter a pool name for the new pool, or a YouTube playlist url.")
                    .setRequired(true)
                )
            ],

    async execute(interaction, command, args, client, user, audioPlayerManager) {

        const id = user.id;
    
        if (args.length < 1) {
            interaction.send('🚫 **|** Not enough arguments! Please enter a name for the new song pool');
            return;
        }

        // If the user entered a playlist.
        if (await ytpl.validateID(args[0])) {
            
            newPool = await Pool.createPoolFromURL(args[0]);
            
            if (user.hasPool(newPool)) {
                interaction.send('🚫 **|** Song pool already exists! Song pools can not have the same name');
                return;
            }

            user.addPool(newPool);
            user.save();
            interaction.send(`✅ **|** Pool **${titleCase(newPool.name)}** created!`);

            return;

        }

        // User wishes to create a new pool.
        else {

            pool = args.join(' ');

            if (user.hasPool(pool)) {
                interaction.send('🚫 **|** Song pool already exists! Song pools can not have the same name');
                return;
            }

            user.addPool(pool);
            user.save();

            interaction.send(`✅ **|** Pool **${titleCase(pool)}** created!`);

        }

	}

};