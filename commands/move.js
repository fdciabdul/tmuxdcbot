module.exports = {
  name: "move",
  aliases: ["mv"],
  run(message, args, client) {
    let queue = client.queues.get(message.guild.id);
    if (!queue) return message.channel.send("No music playing currently!");
    if (args[0] - 1 > 0 || args[1] - 1 > 0) {
      return message.channel.send(
        "Values have to be greater or equal to **0**"
      );
    }
    queue.tracks = array_move(queue.tracks, args[0] - 1, args[1] - 1);
    client.queues.set(message.guild.id, queue);
  },
};
function array_move(arr, old_index, new_index) {
  if (new_index >= arr.length) {
    var k = new_index - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr;
}
