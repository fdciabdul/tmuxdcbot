module.exports = {
  name: "help",
  aliases: ["h"],
  run(message, args, client) {
    let embed = {
      color: 0x53bc8c,
      title: `Welcome in the help section`,
      fields: [
        {
          name: "👮‍♂️ Prefix",
          value: "Prefix for the bot is *. For now you can't change it.",
          inline: false,
        },
        {
          name: "👏 Command usage:",
          value: `So you are wondering how to use commands on ${message.guild.name}?\nIt's very simple. \`*play\``,
          inline: false,
        },
        {
          name: "👀 List of available commands",
          value:
            "play, search, shuffle, skip, nowplaying, move, loop, disconnect, filters, forward, remove",
          inline: false,
        },
        {
          name: "🤫 Coming soon",
          value: "Idk, you can tell me on DM: Linguin#9999",
          inline: false,
        },
      ],
    };
    message.channel.send({ embed: embed });
  },
};
