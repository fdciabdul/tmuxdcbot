const soundcloud = require("soundcloud-scraper");
const ytpl = require("ytpl");
const ytdl = require("discord-ytdl-core");
const ytsr = require("youtube-sr");
const moment = require("moment");
const Track = require("./Track");
require("dotenv").config();

const youtubeVideoRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
const spotifySongRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})/;
const spotifyPlaylistRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:playlist\/|\?uri=spotify:playlist:)((\w|-){22})/;
const spotifyAlbumRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:album\/|\?uri=spotify:album:)((\w|-){22})/;
const youtubePlaylistRegex = /https?:\/\/((youtube.com)|(www.youtube.com))\/(playlist)\?(v=|list=)((\w|-){34})/;

module.exports = {
  isSoundcloudLink(query) {
    return soundcloud.validateURL(query);
  },

  isSpotifySong(query) {
    return spotifySongRegex.test(query);
  },

  isSpotifyPlaylist(query) {
    return spotifyPlaylistRegex.test(query) || spotifyAlbumRegex.test(query);
  },

  isYTPlaylistLink(query) {
    return youtubePlaylistRegex.test(query);
  },

  isYTVideoLink(query) {
    return youtubeVideoRegex.test(query);
  },
  async fetchYoutube(query) {
    // query = encodeURIComponent(query);
    const data = await ytsr.search(query, { type: "video" });
    if (!data || !data[0] || data === []) return null;
    data[0].url = `https://www.youtube.com/watch?v=${await data[0].id}`;
    return data[0];
  },
  async fetchYT(query) {
    const data = await ytsr.search(query, { type: "video", limit: 10 });
    return data;
  },
  getProgressBar(queue) {
    if (!queue) return;
    const currentStreamTime = queue.voiceConnection.dispatcher
      ? queue.voiceConnection.dispatcher.streamTime
      : 0;
    const totalTime = queue.tracks[0].getDuration;
    const index = Math.round((currentStreamTime / totalTime) * 15);

    if (index >= 1 && index <= 15) {
      const bar = "░░░░░░░░░░░░░░░".split("");
      const fill = "█";
      bar.splice(0, index, fill);
      const roznica = 15 - bar.length;
      for (j = 0; j < roznica; j++) {
        bar.unshift(fill);
      }
      const currentTimecode =
        currentStreamTime >= 3600000
          ? moment(currentStreamTime).format("H:mm:ss")
          : moment(currentStreamTime).format("m:ss") ||
            moment(currentStreamTime).format("m:s");
      return `${currentTimecode} ┃ ${bar.join("")} ┃ ${queue.playing.duration}`;
    } else {
      const currentTimecode =
        currentStreamTime >= 3600000
          ? moment(currentStreamTime).format("H:mm:ss")
          : moment(currentStreamTime).format("m:ss");
      return `${
        currentTimecode ? currentStreamTime : "0:00"
      } ┃ ░░░░░░░░░░░░░░░░ ┃ ${queue.playing.duration}`;
    }
  },
  separatePlaylistID(query) {
    query = query.split("=");
    query = query[query.length - 1];
    return query;
  },

  async connectAndPlay(message, client) {
    const Embeds = require("./Embeds");
    let queue = client.queues.get(message.guild.id);
    if (!queue.voiceConnection) {
      queue.voiceConnection = await message.member.voice.channel.join();
    }

    if (queue.tracks[0].url === null) {
      let track = queue.tracks[0];
      let youtubeTrack = await this.fetchYoutube(
        `${track.title} ${track.author}`
      );
      queue.tracks[0] = new Track(
        await youtubeTrack,
        message.author,
        track.fromPlaylist
      );
    }
    Embeds.NowPlaying(queue, message);
    this._playStream(client, message, false);
  },

  _playStream(client, message, updateFilters) {
    let queue = client.queues.get(message.guild.id);
    const seekTime = updateFilters
      ? queue.voiceConnection.dispatcher.streamTime + queue.additionalTime
      : undefined;
    if (updateFilters === true) {
      queue.stream.destroy();
    }

    let encoderArgs = queue.filters[0] ? ["-af", queue.filters.join(",")] : [];
    queue.stream = ytdl(queue.tracks[0].url, {
      filter: "audioonly",
      opusEncoded: true,
      encoderArgs,
      seek: seekTime / 1000,
      quality:140
    });
    if (seekTime) {
      queue.additionalTime = seekTime;
    }
    queue.dispatcher = queue.voiceConnection
      .play(queue.stream, {
        type: "opus",
      })
      .on("finish", () => {
        queue.additionalStreamTime = 0;
        if (queue.loopMode === "none") {
          queue.tracks.shift();
        } else if (queue.loopMode === "queue") {
          let sonk = queue.tracks.shift();
          queue.tracks.push(sonk);
        } else if (queue.loopMode === "song") {
        }

        if (queue.tracks.length === 0) {
          message.guild.me.voice.channel.leave();
          queue.firstMessage.channel
            .send({
              embed: {
                color: 0x51cab0,
                title: "Queue ended so I'm leaving",
                description: "Bye",
              },
            })
            .then((m) => m.react("👋"));
          client.queues.delete(message.guild.id);
          return;
        }
        this.connectAndPlay(message, client);
      });

    queue.isPlaying = true;
    client.queues.set(message.guild.id, queue);
  },
};
