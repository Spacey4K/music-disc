const Discord = require('discord.js');
const package = require('../../package.json');
const os = require('os');
const { exec } = require('child_process');

const color = { white: '\x1B[0m', cyan: '\x1B[36m' };


module.exports = async(client) => {
    client.status = {
        uptime: new Date(),
        os_version: await OSversion(),
        node_version: process.version,
        discord_version: `v${Discord.version}`,
        bot_version: `v${package.version}`,
        cpu: `${os.cpus()[0].model}`
    };


    console.log(`+---------------------+`);
    console.log(`| ${client.config.name}: ${color.cyan}${client.status.bot_version}${color.white}\t|`);
    console.log(`| Node.js: ${color.cyan}${client.status.node_version}${color.white}\t|`);
    console.log(`| Discord.js: ${color.cyan}${client.status.discord_version}${color.white}\t|`);
    console.log(`+---------------------+`);

    /* const commands = await client.application.commands.set(client.commands, client.config.guildId);
    console.log(`Uploaded ${commands.size} commands to guild: ${client.config.guildId}`); */


    client.user.setActivity(client.config.playing, { type: 2 });
    console.log(`>>> Logged in as ${client.user.username}`);
};




function OSversion() {
    let platform = process.platform;

    if (platform === "win32")
        return os.type();

    else if (platform === "linux")
        return new Promise(function(resolve, reject) {
            exec('cat /etc/*release | grep -E ^PRETTY_NAME',
                (error, stdout, stderr) => {
                    if (error !== null) reject(error);

                    let os_version = stdout.split('"')[1];
                    resolve(os_version);
                });
        });

    else
        return process.platform;
}