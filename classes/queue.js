const ytpl = require('ytpl');
const { Song } = require('./song');

module.exports = {

    Queue: class Queue {

        constructor(interaction) {
            this.interaction = interaction;
            this.songs = [];
        }

        getNext() {

            if (this.songs.length == 0) {
                return null;
            }

            return this.songs.shift();

        }

        clear() {
            this.songs = [];
        }

        isEmpty() {
            if (this.songs.length == 0) {
                return true;
            }
            return false;
        }

        getSongList() {
            return this.songs;
        }

        setInteraction(interaction) {
            this.interaction = interaction;
        }

        async addSong(searchTerms) {
            const song = await Song.getSong(searchTerms);
            this.songs.push(song);
            this.interaction.send(`✅ **|** **${song.title}** added to the queue.`);
        }

        async removeSong(searchTerms) {

            const url = await Song.getUrl(searchTerms);
            for (let i = 0; i < this.songs.length; i++) {
                
                if (this.songs[i].url == url) {
                    this.songs.splice(i, 1);
                    return;
                }

            }

        }

        async queuePlaylist(url) {

            const playlist = await ytpl(url);
            for (let i = 0; i < playlist.items.length; i++) {
                let song = playlist.items[i];
                this.songs.push(new Song(song.title, song.shortUrl));
            }

            this.interaction.send(`✅ **|** Playlist **${playlist.title}** added to the queue.`);

        }

    }

}