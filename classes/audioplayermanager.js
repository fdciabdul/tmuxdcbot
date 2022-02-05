const { AudioPlayer } = require("./audioplayer.js");

module.exports = {

    AudioPlayerManager: class AudioPlayerManager {

        constructor() {
            this.audioPlayers = new Map();
        }

        hasPlayer(guildId) {
            return this.audioPlayers.has(guildId);
        }

        getPlayer(guildId) {

            if (this.hasPlayer(guildId)) {
                return this.audioPlayers.get(guildId);
            }
            return null;
            
        }

        createPlayer(guildId, channel, interaction) {

            if (channel == null) {
                return null;
            }

            const newPlayer = new AudioPlayer(channel, interaction, this);
            this.audioPlayers.set(guildId, newPlayer);

            return newPlayer;

        }

        updatePlayer(guildId, channel, interaction) {

            if (!this.hasPlayer(guildId)) {
                return;
            }

            var player = this.getPlayer(guildId);
            player.setInteraction(interaction);
            player.setChannel(channel);

        }

        removePlayer(guildId) {
            this.audioPlayers.delete(guildId);    
        }

    }

}