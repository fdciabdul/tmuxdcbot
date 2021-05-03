const Utils = require("./Utils");

module.exports = {
  YouTubeSongAnnounce(track) {
    return (embed = {
      color: 0xff0000,
      title: `Song added [${track.requestedBy.username}]`,
      description: `[${track.title}](${track.url})`,
    });
  },
  YouTubePlaylistAnnounce(tracks) {
    return (embed = {
      color: 0xff0000,
      title: `Added ${tracks.length} tracks.`,
    });
  },
  SpotifySongAnnounce(track) {
    return (embed = {
      color: 0x1ed760,
      title: `Song added [${track.requestedBy.username}]`,
      description: `[${track.title}](${track.url})`,
    });
  },
  SpotifyListAnnounce(tracks) {
    return (embed = {
      color: 0x1ed760,
      title: `Added ${tracks.length} tracks. [${tracks[0].requestedBy.username}]`,
    });
  },
  SoundCloudSongAnnounce(track) {
    return (embed = {
      color: 0xff6d00,
      title: `Song added [${track.requestedBy.username}]`,
      description: `[${track.title}](${track.url})`,
    });
  },
  CustomSearchAnnounce(track) {
    return (embed = {
      color: 0x5c5c5c,
      title: `Song added [${track.requestedBy.username}]`,
      description: `[${track.title}](${track.url})`,
    });
  },

  NowPlaying(queue, message) {
    let song = queue.tracks[0];
    let embed = {
      color: 0x51cab0,
      title: "Termux Discord Bot By @fdciabdul",
      description: ` Now Playing [${song.title}](https://github.com/fdciabdul/tmuxdcbot)`,
      fields: [
        {
          name: "\u200b",
          value: Utils.getProgressBar(queue),
          inline: false,
        },
        {
          name: `Requested by:`,
          value: `${song.requestedBy.username}`,
          inline: true,
        },
        {
          name: "From playlist:",
          value: song.fromPlaylist ? "Yes" : "No",
          inline: true,
        },
      ],
      image: {
        url: "https://japanesestation.com/wp-content/uploads/2012/12/anime-character-headpone-japan.jpg",
      },
    };
    message.channel.send({ embed: embed }).then((m) => {
      if (queue.lastNowPlaying) {
        queue.lastNowPlaying.delete({ reason: "Avoiding spam" });
      }
      queue.lastNowPlaying = m;
    });
  },
};
