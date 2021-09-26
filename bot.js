const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');
const ytpl = require('ytpl');
const { YTSearcher } = require('ytsearcher');
const auth = require('./auth.json');


const bot = new Discord.Client();
const queue = new Map()


const prefix = '+';

const options = {
    gl: 'TW',
    hl: 'TW',
    limit: 1,
}



bot.on('ready', (message) => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({ activity: { name: `${prefix}help` }, status: 'online' });
});
bot.login(auth.token);




bot.on("message", async (message) => {

    let guildID = message.guild.id;
    let serverQueue = queue.get(message.guild.id);

    let argsUrl = message.content.split(' ');

    if (message.content[0] === prefix) {
        console.log(`--- ${message.author.username} : ${message.content}`)
        let args = message.content.slice(1).trim().split(/ +/g);
        let command = args.shift().toLowerCase();


        switch (command) {

            case 'join':
                Join(message, serverQueue);
                break;

            case 'p':
                Execute(message, serverQueue);
                break;

            case 'skip':
                Skip(message, serverQueue);
                break;

            case 'loop':
                Loop(message, serverQueue);
                break;

            case 'leave':
                Leave(message, serverQueue);
                break;

            case 'pause':
                Pause(message, serverQueue);
                break;

            case 'resume':
                Resume(message, serverQueue);
                break;

            case 'queue':
                Queue(message, serverQueue);
                break;

            case 'help':
                message.channel.send(Embed_help());
                break;
        }
    }
    async function Execute(message, serverQueue) {
        serverQueue = queue.get(message.guild.id);
        let channelVoice = message.member.voice.channel;
        let musicURL;

        const constructor = {
            channel_txt: message.channel,
            channel_voice: channelVoice,
            connection: null,
            music: [],
            volume: 10,
            playing: true,
            loop: false
        };



        if (!channelVoice) {
            return message.channel.send('join channel')
        }
        else { // -------------- use ytsr --------------
            let type = message.content.replace(`${prefix}p`, '').trim();

            if (message.content.indexOf(`http`) > -1 != true) { // youtube search
                console.log('yt search');
                if (!message.content.replace(`${prefix}p`, '').trim())
                    return message.channel.send('error')
                if(String(await search(message.content.replace(`${prefix}p`, '').trim())).match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]+)/))
                musicURL = String(await search(message.content.replace(`${prefix}p`, '').trim()))
                else
                return message.channel.send('Not found, try againg');
            }

            else if (type.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)
                /*type.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/) && message.content.indexOf(`playlist?list`) > -1 === true*/) {
                console.log('yt list');

                let playListUrl = message.content.replace(`${prefix}p`, '').trim();

                console.log(playListUrl);
                playListUrl = playListUrl.split('playlist?list=');
                console.log(`list = ${playListUrl[playListUrl.length - 1]}`);

                let playlist = await ytpl(playListUrl[playListUrl.length - 1]);

                message.channel.send(Embed_list('Play List', playlist.title, playlist.url, message.author.username, message.author.avatarURL(), playlist.url))


                for (var i = 0; i < playlist.items.length; ++i) {
                    console.log(`--[${i}]-----------`);
                    console.log(`${playlist.items[i].title}\n${playlist.items[i].shortUrl}`);

                    let music = {
                        title: playlist.items[i].title,
                        url: playlist.items[i].shortUrl
                    }; console.log(music);

                    queue.set(message.guild.id, constructor);
                    constructor.music.push(music);
                }
                console.log('-----List Done------');

                let connection = await channelVoice.join();
                constructor.connection = connection;

                play(message.guild, constructor.music[0])
                return;
            }

            else if (type.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]+)/)
                /*type.match(/^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/) && message.content.indexOf(`playlist?list`) > -1 !== true*/) {
                console.log('yt link');
                musicURL = message.content.replace(`${prefix}p`, '').trim();
                console.log(musicURL)
            }
            else {
                return message.channel.send('type error')
            }


            let musicInfo = await ytdl.getInfo(musicURL);

            let music = {
                title: musicInfo.videoDetails.title,
                url: musicInfo.videoDetails.video_url
            }; console.log(music);


            if (!serverQueue) {
                /*const constructor = {
                    channel_txt: message.channel,
                    channel_voice: channelVoice,
                    connection: null,
                    music: [],
                    volume: 10,
                    playing: true,
                    loop: false
                };*/

                queue.set(message.guild.id, constructor);
                constructor.music.push(music);

                try {
                    let connection = await channelVoice.join();
                    constructor.connection = connection;
                    play(message.guild, constructor.music[0])
                }
                catch (err) {
                    console.log(err);
                    queue.delete(message.guild.id);
                    return message.channel.send('error')
                }
            } else {
                serverQueue.music.push(music);
                message.react('👍')
                return message.channel.send(Embed_play('Queue', music.title, music.url)).then(msg => { msg.delete({ timeout: 300000 }) })
            }
        }
    }

    async function search(msg) {
        //youtube搜尋
        var firstResultBatch = await ytsr(msg, options);
        var data = JSON.stringify(firstResultBatch.items[0]);
        var { url } = JSON.parse(data)
        console.log(url)
        return url
    }

    function play(guild, music) {
        const serverQueue = queue.get(guild.id);
        if (!music) {
            serverQueue.channel_voice.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            //.play(ytdl(music.url), { filter: 'audioonly' })
            .play(
                ytdl(music.url, {
                    filter: 'audioonly',
                    //bitrate: 192000,  // 192kbps 
                    quality: 'lowestaudio',
                    highWaterMark: 1024 * 1024 * 200
                }))
            .on("start", () => {
                message.react('👍')
                message.channel.send(Embed_play('Now Playing', music.title, music.url)).then(msg => { msg.delete({ timeout: 300000 }) })
            })
            .on("finish", () => {
                if (serverQueue.loop) {
                    play(guild, serverQueue.music[0]);
                }
                else {
                    serverQueue.music.shift();
                    play(guild, serverQueue.music[0]);
                }
            })
    }

    function Join(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!message.member.voice.channel.join)
            return message.channel.send('music already joined');

        message.member.voice.channel.join()
        return message.react('👍')

    }

    function Skip(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can skip');
        if (!serverQueue.connection || !serverQueue.connection.dispatcher || !serverQueue.connection.dispatcher.end)
            return message.channel.send(`TypeError: Cannot read property 'dispatcher' of null`);

        serverQueue.connection.dispatcher.end();
        return message.react('👍')
    }

    function Loop(message, serverQueue) {
        if (!serverQueue.loop) {
            serverQueue.loop = true;
            message.react('⭕')
            console.log('loop : ' + serverQueue.loop)
        }
        else {
            serverQueue.loop = false;
            message.react('❌')
            console.log('loop : ' + serverQueue.loop)
        }
    }

    function Leave(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');

        serverQueue.music = [];
        serverQueue.loop = false;
        serverQueue.connection.dispatcher.end();
        return message.react('👍')
    }

    function Pause(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue.connection)
            return message.channel.send('nothing can pause');
        if (!serverQueue.connection.dispatcher.pause)
            return message.channel.send('music already paused');

        serverQueue.connection.dispatcher.pause();
        return message.react('👍')
    }

    function Resume(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue.connection)
            return message.channel.send('nothing can resume');
        if (!serverQueue.connection.dispatcher.resume)
            return message.channel.send('music already resume');

        serverQueue.connection.dispatcher.resume();
        return message.react('👍')
    }

    function Queue(message, serverQueue) {
        if (!message.member.voice.channel)
            return message.channel.send('join channel,first');
        if (!serverQueue)
            return message.channel.send('nothing can queue');

        let nowPlaying = serverQueue.music[0];
        let queueMsg = `Now Playing : ${nowPlaying.title}`

        if (serverQueue.music[1]) {
            if(serverQueue.music.length >= 15){
                queueMsg += `\n---------------\n`;
            for (var i = 1; i <= 10; i++) {

                queueMsg += `${i}. ${serverQueue.music[i].title}\n`
                console.log(`${i}. ${serverQueue.music[i].title}\n`)
            }queueMsg += `and ${serverQueue.music.length} more songs...`
            }
            else{
                queueMsg += `\n---------------\n`;
            for (var i = 1; i < serverQueue.music.length; i++) {

                queueMsg += `${i}. ${serverQueue.music[i].title}\n`
                console.log(`${i}. ${serverQueue.music[i].title}\n`)
            }
            }
        }
        message.react('👍')
        return message.channel.send(Embed_queue('Queue', queueMsg))
    }
})



function Embed_play(status, music_title, music_url) {
    const Embed_play = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, `[${music_title}](${music_url})`, true)
        .setTimestamp()
    return Embed_play
}

function Embed_queue(status, queueMsg) {
    const Embed_queue = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField(status, queueMsg)
        .setTimestamp()
    return Embed_queue
}

function Embed_help() {
    const Embed_help = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .addField('Help', '```+p空格網址  => 播放音樂\n+pause     => 暫停音樂\n+resume    => 恢復播放\n+skip      => 跳過音樂\n+loop      => 循環音樂\n+queue     => 查看列隊\n+leave     => 離開頻道```', true)
        .setTimestamp()
    return Embed_help
}

function Embed_list(status, list_title, list_url, user, header, url) {
    const Embed_list = new Discord.MessageEmbed()
        .setColor('#FFFFFF')
        .setAuthor(user, header, url)
        .addField(status, `[${list_title}](${list_url})`, true)
        .setTimestamp()
    return Embed_list
}
