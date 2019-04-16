let str = "[20:12:53] [Server thread/INFO]: MoistSenpai joined the game \n[20:13:07] [Server thread/INFO]: MoistSenpai has reached the goal [Hired Help]";

let reg = str.match(/^\[[\d:]{8}\] \[Server thread\/INFO\]: (\w+) has made the advancement \[([\w\s]+)\]/);

console.log(reg);
