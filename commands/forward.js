const { _playStream } = require("../lib/Utils");

module.exports = {
  name: "forward",
  aliases: ["ff"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    let seconds;
    if (!isNaN(args[0])) {
      seconds = args[0];
    } else {
      seconds = 10;
    }
    queue.additionalTime = seconds * 1000;
    _playStream(client, message, true);
  },
};
