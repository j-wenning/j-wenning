const fs = require('fs');
const path = require('path');

const generateFilename = () => {
    const date = new Date(Date.now());
    return '' 
            + date.getFullYear()
            + date.getMonth().toString().padStart(2, '0')
            + date.getDate().toString().padStart(2, '0')
            + date.getHours().toString().padStart(2, '0')
            + date.getMinutes().toString().padStart(2, '0')
            + date.getSeconds().toString().padStart(2, '0')
            + '.json';
}
const getNewestLog = () => fs.readdirSync(path.join(__dirname, 'log')).sort((a, b) => parseInt(a) - parseInt(b)).pop();
const readNewestLog = () => fs.readFileSync(path.join(__dirname, 'log', getNewestLog()), { encoding: 'utf-8' });

class LogManager {
    constructor() {
        this.log = [];
        global.setInterval(() => this.trySaveLog(), process.env.LOG_REFRESH_INTERVAL);
        process.on('exit', () => this.trySaveLog(true));
    }
    trySaveLog(force = false) {
        if((force && this.log.length > 0) || this.log.length > process.env.LIVE_LOG_CAPACITY) {
            this.saveLog();
            this.log = [];
        }
    }
    saveLog() {
        console.log('Caching log...');
        fs.writeFileSync(path.join(__dirname, 'log', generateFilename()), JSON.stringify(this.log), { flag: 'wx+' });
        console.log('Cache complete.');
    }
    recordItem(data) { if(data) this.log.push(data); }
    getLog() { return [...JSON.parse(readNewestLog()), ...this.log]; }
}

module.exports = new LogManager();