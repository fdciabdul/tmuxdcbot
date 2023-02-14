const fs = require('fs');
const { Client, GatewayIntentBits, ClientVoiceManager, Collection } = require('discord.js');
const { AudioPlayerManager } = require('./classes/audioplayermanager.js');
const { User } = require('./classes/user.js');
const { Interaction } = require('./classes/interaction.js');

const { token, admin, prefix } = require('./config.json');

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages, 
GatewayIntentBits.GuildVoiceStates
]
})

client.commands = new Collection();

const operators = admin;

// Set up commands.
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {

    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);

    command.aliases.forEach(alias => {
        client.commands.set(alias, command);
    });

}

// Audio Player Manager.
const audioPlayerManager = new AudioPlayerManager();

client.once('ready', () => {
    console.log(`
 TERMUX MUSIC BOT 

https://github.com/fdciabdul/tmuxdcbot
by : fdciabdul


`);
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isCommand()) return;

    const command = interaction.commandName.toLowerCase();
    const args = [];
    const user = User.load(interaction.user.id);

    if (typeof interaction.options !== 'undefined') {
        interaction.options._hoistedOptions.forEach(option => {
            option.value.split(/\s+/).forEach(arg => {
                args.push('' + arg);
            });
        });
    }

    execute(interaction, command, args, user);

});

client.on('messageCreate', (message) => {

    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/\s+/);
    const command = args.shift().toLowerCase();
    const user = User.load(message.author.id);

    execute(message, command, args, user);

});

client.login(token);

function execute(interaction, command, args, user) {

    if (typeof client.commands.get(command) === 'undefined') {
        return;
    }

    interaction = new Interaction(interaction);

    if (client.commands.get(command).operatorOnly && !operators.includes(id)) {
        interaction.send("You don't have sufficient permission to use this command");
        return;
    }

    client.commands.get(command).execute(interaction, command, args, client, user, audioPlayerManager);

}
