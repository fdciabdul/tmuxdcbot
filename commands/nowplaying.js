const Embeds = require("../lib/Embeds");
module.exports = {
  name: "nowplaying",
  aliases: ["np"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    const song = queue.tracks[0];
    if (!song) return message.channel.send("No music playing currently!");
    Embeds.NowPlaying(queue, message);
  },
};
