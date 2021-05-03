class Track {
  constructor(trackData, author, fromPlaylist) {
    this.title = trackData.title || trackData.videoDetails.title;

    this.url = trackData.url || null;

    this.author = trackData.author;

    this.thumbnail = trackData.thumbnail
      ? trackData.thumbnail.url
      : trackData.thumbnail_url || trackData.thumbnails
      ? trackData.thumbnails[0].url
      : trackData.videoDetails.thumbnails[3].url;

    this.duration =
      trackData.durationSec ||
      trackData.length ||
      trackData.durationFormatted ||
      `${Math.floor(parseInt(trackData.videoDetails.lengthSeconds) / 60)}:${
        parseInt(trackData.videoDetails.lengthSeconds) % 60
      }`;

    this.requestedBy = author;

    this.fromPlaylist = fromPlaylist;

    this.author = trackData.channel
      ? trackData.channel.name
      : trackData.artist || trackData.author
      ? trackData.author.name
      : trackData.videoDetails.author.name;
  }
  get getDuration() {
    const args = this.duration.split(":");
    switch (args.length) {
      case 3:
        return (
          parseInt(args[0]) * 60 * 60 * 1000 +
          parseInt(args[1]) * 60 * 1000 +
          parseInt(args[2]) * 1000
        );
      case 2:
        return parseInt(args[0]) * 60 * 1000 + parseInt(args[1]) * 1000;
      default:
        return parseInt(args[0]) * 1000;
    }
  }
}
module.exports = Track;
