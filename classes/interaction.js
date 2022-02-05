module.exports = {

    Interaction: class Interaction {

        constructor(interaction) {
            
            this.interaction = interaction;
            this.deferred = false;
            this.firstMessage = true;
            this.firstReplySent = false;

            const json = interaction.toJSON()

            if (json['type'] == 'APPLICATION_COMMAND') {
                this.isInteraction = true;
            }

            else {
                this.isInteraction = false;
            }

        }

        defer() {
            
            if (!this.isInteraction) {
                return;
            }

            this.deferred = true;
            this.interaction.deferReply();

        }

        send(output) {

            if (!this.isInteraction) {
                this.interaction.channel.send(output);
            }

            else if (this.firstMessage && this.deferred) {

                this.interaction.editReply(output);
                this.firstMessage = false;

            }

            else if (this.firstMessage) {
                
                this.interaction.reply(output);
                this.firstMessage = false;
                this.firstReplySent = true;

            }

            else {

                if (this.firstReplySent) {

                    setTimeout(() => {
                        this.interaction.followUp(output)
                        this.firstReplySent = false;
                    }, 1000);
                    return;

                }

                this.interaction.followUp(output);
                
            }

        }

        getUserId() {

            if (!this.isInteraction) {
                return this.interaction.author.id;
            }

            return interaction.user.id;;

        }

        getGuildId() {

            if (!this.isInteraction) {
                return this.interaction.member.guild.id;
            }
            
            return this.interaction.guildId;
    
        }

        getGuild() {
            return this.interaction.guild;
        }

        getGuildName() {
            return this.interaction.guild.name;
        }

        getVoiceChannel() {
            return this.interaction.member.voice.channel;
        }

        getUsername() {

            if (!this.isInteraction) {
                return this.interaction.author.username;
            }
    
            return this.interaction.user.username;

        }

    }

}