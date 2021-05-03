const Embeds = require("../lib/Embeds");
const Queue = require("../lib/Queue");
const Track = require("../lib/Track");
const Utils = require("../lib/Utils");
module.exports = {
  name: "search",
  aliases: [],
  async run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    const query = args.join(" ");
    if (!query || query === "") {
      return message.channel.send("❌ You have to specify a search query!");
    }
    const data = await Utils.fetchYT(query);
    if (!data || !data[0]) {
      return message.channel.send("❌ No results found!");
    }
    let embed = {
      color: 0x51cab0,
      title: `Search results for ${args.join(" ")}`,
      footer: { text: "Type number from 1 to 10 to choose a song" },
    };
    let songList = "";
    let num = 1;
    for (song of data) {
      songList += `${num}. ${song.title} ${song.durationFormatted}\n`;
      num++;
    }
    embed.description = songList;
    message.channel.send({ embed: embed });
    let collected = "";
    let trackToAdd;
    const collector = message.channel.createMessageCollector(
      (m) => m.author === message.author,
      { time: 15000, max: 1 }
    );

    collector.on("collect", async (m) => {
      if (!isNaN(m.content)) {
        collected = m;
        trackToAdd = new Track(
          data[parseInt(collected.content) - 1],
          message.author
        );
        if (!queue) {
          queue = new Queue(message);
          queue.voiceConnection = await message.member.voice.channel.join();
        }
        queue.tracks.push(trackToAdd);
        client.queues.set(message.guild.id, queue);
        Embeds.CustomSearchAnnounce(trackToAdd);
        if (!queue.isPlaying) Utils.connectAndPlay(message, client);
      } else {
        message.react("❌");
      }
    });
    collector.on("end", (data) => {
      if (!data.first()) {
        return message.channel.send("You didn't respond to me :(");
      }
    });
  },
};
