module.exports = {
  name: "queue",
  aliases: ["q"],
  run(message, args, client) {
    const queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    let msg = "";
    n = 1;
    for (i = n - 1; i < queue.tracks.length; i++) {
      msg += `${n}. ${queue.tracks[i].title}\n`;
      n++;
    }
    message.channel.send(msg, { code: true, split: true });
  },
};
