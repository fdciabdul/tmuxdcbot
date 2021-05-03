const Utils = require("../lib/Utils");
const ytdl = require("discord-ytdl-core");
const ytpl = require("ytpl");
const spotify = require("spotify-url-info");
const soundcloud = require("soundcloud-scraper");
const key = soundcloud.keygen();
const scrapper = new soundcloud.Client(key);
const Track = require("../lib/Track");
const Queue = require("../lib/Queue");
const Embeds = require("../lib/Embeds");

module.exports = {
  name: "play",
  aliases: ["p"],
  async run(message, args, client) {
    const query = args.join(" ");
    let trackToAdd;
    let tracksToAdd = [];
    let embed;

    if (
      client.queues.has(message.guild.id) &&
      client.queues.get(message.guild.id).voiceConnection &&
      client.queues.get(message.guild.id).voiceConnection.dispatcher &&
      client.queues.get(message.guild.id).voiceConnection.dispatcher.paused
    ) {
      client.queues.get(message.guild.id).dispatcher.resume();
      return message.react("▶");
    } else {
      if (!query || query === "")
        return message.channel.send("❌ You have to specify link or query!");
    }

    const queryType = classifyQuery(query);
    switch (queryType) {
      case "youtube-video":
        tracksToAdd = [];
        const videoData = await ytdl.getBasicInfo(query);
        videoData.url = videoData.videoDetails.video_url;
        trackToAdd = new Track(videoData, message.author, false);
        embed = Embeds.YouTubeSongAnnounce(trackToAdd);
        break;
      case "youtube-playlist":
        let ID = await Utils.separatePlaylistID(query);
        const YTplaylistData = (await ytpl(ID)).items;
        console.log(YTplaylistData);
        for (item of YTplaylistData) {
          if (item.duration || item.author) {
            item.author = item.author.name;
            tracksToAdd.push(new Track(item, message.author, true));
          }
        }
        embed = Embeds.YouTubePlaylistAnnounce(tracksToAdd);
        break;
      case "spotify-song":
        let songData = await spotify.getData(query);
        let spotifyData = await Utils.fetchYoutube(
          `${songData.artist || songData.artists[0].name} ${songData.name}`
        );
        trackToAdd = new Track(spotifyData, message.author, false);
        embed = Embeds.SpotifySongAnnounce(trackToAdd);
        break;
      case "spotify-playlist":
        tracksToAdd = [];
        let playlistData = await spotify.getTracks(query);
        let i = 0;
        while (i < playlistData.length) {
          let data = playlistData;
          if (!data[i]) break;
          let itemData = playlistData[i];
          itemData.title = itemData.name;
          itemData.author = itemData.artists[0] || itemData.artists[0].name;
          itemData.thumbnail = "Not Fetched";
          itemData.length = itemData.duration_ms / 1000;
          tracksToAdd.push(new Track(itemData, message.author, true));
          i++;
        }
        embed = Embeds.SpotifyListAnnounce(tracksToAdd);
        break;
      case "soundcloud":
        tracksToAdd = [];
        let soundclouData = await scrapper.getSongInfo(query);
        let ytData = await Utils.fetchYoutube(`${soundclouData.title}`);
        trackToAdd = new Track(ytData, message.author, false);
        embed = Embeds.SoundCloudSongAnnounce(trackToAdd);
        break;
      case "search":
        let youtubeSearch = await Utils.fetchYoutube(`${query}`);
        if (youtubeSearch === null)
          return message.channel.send("❌ No results found");
        trackToAdd = new Track(youtubeSearch, message.author, false);
        embed = Embeds.CustomSearchAnnounce(trackToAdd);
        break;
    }

    message.channel.send({ embed: embed });

    if (trackToAdd !== undefined) {
      if (!client.queues.has(message.guild.id)) {
        const newQueue = new Queue(message);
        newQueue.tracks.push(trackToAdd);
        client.queues.set(message.guild.id, newQueue);
      } else {
        const queue = client.queues.get(message.guild.id);
        queue.tracks.push(trackToAdd);
        client.queues.set(message.guild.id, queue);
      }
    } else if (tracksToAdd !== []) {
      if (!client.queues.has(message.guild.id)) {
        const newQueue = new Queue(message);
        newQueue.tracks = tracksToAdd;
        client.queues.set(message.guild.id, newQueue);
      } else {
        const queue = client.queues.get(message.guild.id);
        for (track of tracksToAdd) {
          queue.tracks.push(track);
        }
        client.queues.set(message.guild.id, queue);
      }
    }
    if (!client.queues.get(message.guild.id).isPlaying)
      Utils.connectAndPlay(message, client);

    trackToAdd = null;
    tracksToAdd = null;
  },
};

const classifyQuery = (query) => {
  if (Utils.isSoundcloudLink(query)) {
    return "soundcloud";
  } else if (Utils.isSpotifySong(query)) {
    return "spotify-song";
  } else if (Utils.isSpotifyPlaylist(query)) {
    return "spotify-playlist";
  } else if (Utils.isYTPlaylistLink(query)) {
    return "youtube-playlist";
  } else if (Utils.isYTVideoLink(query)) {
    return "youtube-video";
  } else {
    return "search";
  }
};
