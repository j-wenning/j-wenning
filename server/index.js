require('dotenv/config');
const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

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
const prevHistory = [];
const msgHistory = [];
let isOnline = false;
let ipAdmin;
let roomAdmin;

const fullTrim = str => str.trim().replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/\s{3,}/g,'  ');
const log = (print, save, ...args) => {
    if (print) {
        const { author: author, timeStamp: timeStamp, msgContent: msgContent } = args[0];
        console.log(...args);   
        if (author && timeStamp && msgContent) io.to(roomAdmin).send(args[0]);
        else io.to(roomAdmin).send(systemMsg([...args].map(item => typeof item === typeof Object() ? JSON.stringify(item) : item).join(' ')));
    }
    if (save) msgHistory.push(args.map(item => JSON.stringify(item)).join(' '));
};
const saveHistory = () => {
    if (!msgHistory.length) return;
    const date = new Date(Date.now());
    const fileName = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}-${date.getHours()}.${date.getMinutes()}.${date.getSeconds()}_logs.json`;
    fs.writeFileSync(path.join(__dirname, '..', fileName), JSON.stringify(msgHistory, null, 2));
    prevHistory.splice(0);
    prevHistory.concat(msgHistory);
    msgHistory.splice(0);
    console.log('saved logs to' + fileName);
}
const systemMsg = msg => ({
    author: 'System',
    timeStamp: Date.now(), 
    msgContent: msg
});
const onlineMsg = () => systemMsg(`[Justin is currently ${isOnline ? 'online' : 'offline'}]` );
const getInput = input => {
    if (typeof input !== typeof String()) return;
    if (input === 'list') {
        for (let i = 0; i < roomHelper.length; ++i) {
            if (!roomHelper[i].isActive) {
                roomHelper.splice(i, 1);
                --i;
            }
            roomHelper.map((item, index) => item.index = index);
        }
        log(true, false, roomHelper.map(item => ({ index: item.index, author: item.author })));
    } else if (input.substr(0, 1) === '!') {
        const [index, ...msgContent] = input.substr(1).split(' ');
        if (isNaN(parseInt(index)) || index < 0 || index >= roomHelper.length) console.error('Invalid index');
        else if (msgContent.length === 0) console.error('Invalid message');
        else {
            const obj = {
                author: 'Justin',
                timeStamp: Date.now(),
                msgContent: fullTrim(msgContent.join(' '))
            };
            io.to(roomHelper[index].id).send(obj);
            log(true, true, obj);
        }
    } else if (/^Is(| +)Online$/gi.test(input)) {
        log(true, false, "Is online:", isOnline);
    } else if (/^Toggle(| +)Online$/gi.test(input)) {
        isOnline = !isOnline;
        io.emit('message', onlineMsg());
        log(true, true, 'Is online:', isOnline);
    } else log (true, false, "Invalid input:", input );
};

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.post('/adminlogin', (req, res, next) => {
    const { u, p } = req.body;
    if (u !== process.env.ADMIN_USER || p !== process.env.ADMIN_PASS) {
        return res.redirect(301, 'https://jwenning.digital');
    }
    ipAdmin = req.ip;
    res.json(JSON.stringify([...prevHistory, ...msgHistory]));
});

app.use((err, req, res, next) => {
    const error = err || new Err();
    if (!err.msg) return res.statusCode(error.code);
    res.status(error.code).json({ 'code': error.code, 'msg': error.msg });
});

io.on('connect', sock => {
    const { id } = sock;
    const room = { index: null, author: undefined, isActive: true, id };
    if (sock.handshake.address === ipAdmin) {
        roomAdmin = id;
        sock.on('message', data => { getInput(data) });
        sock.on('disconnect', () => roomAdmin = null);
        return;
    }
    room.index = roomHelper.push(room) - 1;
    sock.send(onlineMsg());

    sock.on('message', data => {
        room.author = data.author;
        log(true, true, data);
    });
    sock.on('nameChange', data => {
        const { author } = data;
        const prevAuthor = room.author;
        room.author = author;
        if (prevAuthor === undefined) log(true, `${author} has joined`);
        else log(true, true, `${prevAuthor} has changed their name to ${author}`);
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