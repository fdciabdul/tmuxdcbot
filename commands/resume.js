module.exports = {
  name: "resume",
  aliases: ["res"],
  run(message, args, client) {
    if (
      client.queues.has(message.guild.id) &&
      client.queues.get(message.guild.id).voiceConnection &&
      client.queues.get(message.guild.id).voiceConnection.dispatcher &&
      client.queues.get(message.guild.id).voiceConnection.dispatcher.paused
    ) {
      client.queues.get(message.guild.id).dispatcher.resume();
      return message.react("▶");
    }
  },
};
