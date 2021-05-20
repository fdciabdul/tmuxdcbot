const Discord = require("discord.js");
const fs = require("fs");
const config = require("./config");
const banner = require("ascii-art");
require("dotenv").config();
var clc = require("cli-color");
const client = new Discord.Client();
client.queues = new Discord.Collection();

client.commands = new Discord.Collection();
const commands = fs
  .readdirSync(__dirname + "/commands")
  .filter((file) => file.endsWith(`.js`));
commands.forEach((command) => {
  const comand = require(__dirname + `/commands/${command}`);
  if (comand.name) {
    client.commands.set(comand.name, comand);
  }
});
var figlet = require('figlet');
 
figlet.text("fdciabdul!", {
  font: 'Ghost',
  horizontalLayout: 'default',
  verticalLayout: true,
  width: 150,
  whitespaceBreak: true
}, function(err, data) {
  if (err) {
      console.log('Something went wrong...');
      console.dir(err);
      return;
  }
  console.log(data);
});
client.on("ready", () => {
  console.log(clc.green(`
  Ready to start ! ${client.user.tag}

  dont forget to subscribe fdciabdul channel :)
  `));
  client.user.setPresence({
    activity: {
      name: `*help | ${client.guilds.cache.size} servers`,
      type: "LISTENING",
    },
    status: "online",
  });
});

client.on("message", async (message) => {
  console.log(clc.red("New Message = > "+ message.content));
  if (message.author.bot || !message.guild || !message.content.startsWith(config.prefix))
    return;
  if (!message.member.voice.channel && message.content !== ("!h" || "!help"))
    return message.channel.send("❌ You're not in a voice channel.");

  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmd =
    client.commands.get(command) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(command));

  if (!cmd) return;
  try {
    cmd.run(message, args, client);
  } catch (error) {
    console.log(error);
  }
});

client.on("voiceStateUpdate", (oldState, newState) => {
  let queue = client.queues.find((g) => g.guildID === oldState.guild.id);
  if (!queue) return;

  if (newState.member.id === client.user.id && !newState.channelID) {
    queue.dispatcher.destroy();
    queue.stream.destroy();
    client.queues.delete(newState.guild.id);
  }
  if (
    queue.voiceConnection &&
    queue.voiceConnection.channel.members.array().length <= 1
  ) {
    setTimeout(() => {
      if (
        queue.voiceConnection &&
        queue.voiceConnection.channel.members.array().length <= 1
      ) {
        queue.dispatcher.destroy();
        queue.voiceConnection.dispatcher.destroy();
        queue.voiceConnection.channel.leave();
        queue.stream.destroy();
        client.queues.delete(message.guild.id);
        queue.firstMessage.channel
          .send({
            embed: {
              color: 0x51cab0,
              title: "I was innactive for too long.",
              description: "Bye",
            },
          })
          .then((m) => m.react("👋"));
      }
    }, 50000);
  }
  queue = null;
});

client.login(config.TOKEN);
