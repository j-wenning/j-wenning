const fs = require('fs');
const path = require('path');

const readFile = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'session', 'sessions.json'), { encoding: 'utf-8' }));
const initFile = () => fs.writeFileSync(path.join(__dirname, 'session', 'sessions.json'), '{}', { flag: 'wx+' });
const saveFile = data => fs.writeFileSync(path.join(__dirname, 'session', 'sessions.json'), data);
const randStr = () => Buffer.from(Math.floor(Math.random() * Number.MAX_VALUE).toString()).toString('base64');

class SessionManager {
    constructor() {
        try {
            this.sessions = readFile();
        } catch(err) {
            if (err.code === 'ENOENT') {
                initFile();
                this.sessions = readFile();
            } else this.sessions = {};
        }
        global.setInterval(() => {
            const time = Date.now();
            for(const id in this.sessions) {
                if (this.getSession(id).expiry < time) {
                    this.deleteSession(id);
                }
            }
        }, parseInt(process.env.SESSION_REFRESH_INTERVAL));
        process.on('exit', () => this.saveSessions());
    }
    saveSessions() { 
        console.log('Caching sessions...');
        saveFile(JSON.stringify(this.sessions));
        console.log('Cache complete.');
    }
    createSession(data = {}) {
        let id;
        do id = randStr();
        while (this.sessions[id]);
        this.sessions[id] = data;
        this.sessions[id].expiry = Date.now() + parseInt(process.env.SESSION_EXPIRY);
        return id;
    }
    getSession(id) { return id ? this.sessions[id] || {} : {}; }
    updateSession(id, data) { Object.assign(this.sessions[id], data); }
    deleteSession(id) { delete this.sessions[id]; }
};

module.exports = new SessionManager();