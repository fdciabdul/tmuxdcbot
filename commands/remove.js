module.exports = {
  name: "remove",
  aliases: ["rm"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    const length = queue.tracks.length;

    if(!isNaN(args[0])){
        if(args[0] <= length){
            let deleted = queue.tracks.splice((args[0]-1),1);
            message.channel.send(`Successfuly removed **${deleted[0].title}** from queue`);
        }
        else{
            return message.repy("I don't even have that much tracks in memory LUL")
        }
    }
    else{
        return message.reply(`You need to specify a number, not **${args[0]}**`);
    }
    client.queues.set(message.guild.id,queue);
  },
};
