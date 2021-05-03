module.exports = {
  name: "skip",
  aliases: ["s"],
  async run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    queue.dispatcher.end();
  },
};
