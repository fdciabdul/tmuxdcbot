module.exports = {
  name: "pause",
  aliases: ["stop"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    queue.dispatcher.pause();
    message.react("⏸");
  },
};
