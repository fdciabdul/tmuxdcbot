module.exports = {
  name: "loop",
  aliases: [],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");

    switch (queue.loopMode) {
      case "none":
        queue.loopMode = "queue";
        break;
      case "queue":
        queue.loopMode = "song";

        break;
      case "song":
        queue.loopMode = "none";
        break;
    }

    message.channel.send(
      `Changed loop mode to **${queue.loopMode.toUpperCase()}**`
    );
  },
};
