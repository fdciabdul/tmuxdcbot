module.exports = {
  name: "shuffle",
  aliases: [],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    const currentTrack = queue.tracks.shift();
    queue.tracks = queue.tracks.sort(() => Math.random() - 0.5);
    queue.tracks.unshift(currentTrack);
    message.react("🔀");
  },
};
