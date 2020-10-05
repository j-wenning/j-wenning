require('dotenv/config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const readline = require('readline');
const { exec } = require('child_process');
const rl = readline.createInterface({ input: process.stdin });

class Err {
    constructor(code = 500, msg) {
        this.code = code;
        this.msg = msg;
    }
}

const MS_TO_S = 1000;
const S_TO_MIN = 60;
const MIN_TO_HR = 60;
const HR_TO_DAY = 24;
const roomHelper = [];
const msgHistory = [];
let isOnline = false;

const fullTrim = str => str.trim().replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g,'  ');
const log = (print, ...args) => {
    if (print) console.log(...args);
    msgHistory.push(args.map(item => JSON.stringify(item)).join(' '));
};
const saveHistory = () => {
    if (!msgHistory.length) return;
    const date = new Date(Date.now());
    const fileName = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}-${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}_logs.json`;
    fs.writeFileSync(path.join(__dirname, '..', fileName), JSON.stringify(msgHistory, null, 2));
    console.log('saved logs to' + fileName);
}
const onlineMsg = () => ({
    author: 'System',
    timeStamp: Date.now(), 
    msgContent: `[Justin is currently ${isOnline ? 'online' : 'offline'}]` 
});
const getInput = () => rl.question('', ans => {
    if (ans === 'logs') console.log(msgHistory); 
    else if (ans === 'list') {
        for (let i = 0; i < roomHelper.length; ++i) {
            if (!roomHelper[i].isActive) {
                roomHelper.splice(i, 1);
                --i;
            }
            roomHelper.map((item, index) => item.index = index);
        }
        console.log(roomHelper.map(item => ({ index: item.index, author: item.author })));
    } else if (ans.substr(0, 1) === '!') {
        const [index, ...msgContent] = ans.substr(1).split(' ');
        if (isNaN(Number(index)) || index < 0 || index >= roomHelper.length) console.error('Invalid index');
        else if (msgContent.length === 0) console.error('Invalid message');
        else {
            const obj = {
                author: 'Justin',
                timeStamp: Date.now(),
                msgContent: fullTrim(msgContent.join(' '))
            };
            io.to(roomHelper[index].id).send(obj);
            log(false, "Sent", obj);
            console.log('Sent message');
        }
    } else if (/^Is(| +)Online$/gi.test(ans)) {
        log(true, "Is online", isOnline);
    } else if (/^Toggle(| +)Online$/gi.test(ans)) {
        isOnline = !isOnline;
        io.emit('message', onlineMsg());
        log(true, 'Sent toggle', isOnline);
    } else if (/^Shut(| +)Down$/gi.test(ans)) {
        process.exit(0);
    }
    global.setTimeout(() => getInput(), 0);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/port', (req, res) => res.json({ 'port': process.env.PORT }));

app.use((err, req, res, next) => {
    const error = err || new Err();
    if (!err.msg) return res.statusCode(error.code);
    res.status(error.code).json({ 'code': error.code, 'msg': error.msg });
});

io.on('connect', sock => {
    const { id } = sock;
    const room = { index: null, author: undefined, isActive: true, id };
    room.index = roomHelper.push(room) - 1;
    sock.send(onlineMsg());
    sock.on('message', data => {
        const { author, timeStamp, msgContent } = data;
        room.author = author;
        log(true, `[${new Date(timeStamp).toLocaleString()}]`, author + ':\n' + msgContent);
    });
    sock.on('nameChange', data => {
        const { author } = data;
        const prevAuthor = room.author;
        room.author = author;
        if (prevAuthor === undefined) log(true, `${author} has joined`);
        else log(true, `${prevAuthor} has changed their name to ${author}`);
    });
    sock.on('disconnect', () => room.isActive = false);
});

server.listen(process.env.PORT, null, () => console.log(`Listening on port ${process.env.PORT}`));

process.on('SIGINT', () => process.exit(0));

process.on('SIGUSR2', () => process.exit(0));

process.on('exit', () => saveHistory());

global.setInterval(() => {
    saveHistory();
}, 1 * MS_TO_S * S_TO_MIN * MIN_TO_HR * HR_TO_DAY);

getInput();