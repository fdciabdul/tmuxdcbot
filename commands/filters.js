const filters = require("../lib/Filters.json");
const Utils = require("../lib/Utils");
module.exports = {
  name: "filters",
  aliases: [],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    switch (args[0]) {
      case "add":
        if (validateFilter(args[1]) === false)
          return message.channel.send("❌ This filter doesn't exits!");
        queue.filters.push(filters[args[1]]);
        message.react("👍");
        Utils._playStream(client, message, true);
        break;
      case "delete":
      case "remove":
      case "rm":
      case "del":
        if (validateFilter(args[1]) === false)
          return message.channel.send("❌ This filter doesn't exits!");
        for (i = 0; i < queue.filters.length; i++) {
          if (filters[args[1]] === queue.filters[i]) {
            queue.filters.splice(i, 1);
          }
        }
        message.react("👍");
        Utils._playStream(client, message, true);
        break;
      case "help":
      case "all":
        let string = "";
        Object.keys(filters).forEach((element) => {
          string += element + "\n";
        });
        message.channel.send(string, { code: true });
        break;

      case "active":
      case "list":
        let embed = {
          color: 0x51cab0,
          title: "Filters that are active",
        };
        let string1 = "";
        for (filter of queue.filters) {
          Object.keys(filters).forEach((element) => {
            if (filters[element] === filter) {
              string1 += element + "\n";
            }
          });
        }

        if (string1 === "") {
          string1 = "No filters active";
        }
        embed.description = string1;
        message.channel.send({ embed: embed });
        break;
    }
  },
};

const validateFilter = (arg) => {
  Object.keys(filters).forEach((element) => {
    if (element === arg) {
      return true;
    }
  });
};
