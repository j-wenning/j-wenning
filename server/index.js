require('dotenv/config');
const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const Error = require('./error-object');
const logManager = require('./log-manager');
const sessionManager = require('./session-manager');
const socketManager = require('./socket-manager')(io, sessionManager, logManager);
const uriParser = require('./uri-parser');
const msg = require('./msg');


app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use('/', (req, res, next) => {
    req.cookies = uriParser(req.headers.cookie);
    req.cookies.id = sessionManager.updateSession(
        req.cookies.id,
        { expiry: Date.now() + parseInt(process.env.SESSION_EXPIRY) }
    );
    res.cookie('id', req.cookies.id, { 
        expires: new Date(sessionManager.getSession(req.cookies.id).expiry),
        secure: process.env.PROD_MODE !== 'DEV',
    });
    next();
});

app.post('/admin', (req, res, next) => {
    const { u, p } = req.body;
    if (u !== process.env.ADMIN_USER || p !== process.env.ADMIN_PASS) {
        sessionManager.updateSession(req.cookies.id, { isAdmin: false });
        return next(new Error(401));
    }
    sessionManager.updateSession(req.cookies.id, { isAdmin: true });
    res.json(JSON.stringify(logManager.getLog()));
});

app.use((err, req, res, next) => {
    const error = err || new Error();
    if (!error.message) return res.sendStatus(error.code);
    res.status(error.code).json(JSON.stringify(msg('System', error.code + ': ' + error.message)));
});

server.listen(process.env.PORT, null, () => console.log(`Listening on port ${process.env.PORT}`));

process.on('SIGINT', code => process.exit(code));

process.on('SIGUSR1', code => process.exit(code));

process.on('SIGUSR2', code => process.exit(code));

process.on('uncaughtException', code => process.exit(code));

if(process.env.PROD_MODE === 'DEV') process.on('exit', () => process.exit(1));