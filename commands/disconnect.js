module.exports = {
  name: "disconnect",
  aliases: ["leave", "fuckoff"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");

    queue.voiceConnection.dispatcher.destroy();
    queue.voiceConnection.channel.leave();
    queue.dispatcher.destroy();
    queue.stream.destroy();
    client.queues.delete(message.guild.id);
    queue = null;
    message.react("👋");
  },
};
