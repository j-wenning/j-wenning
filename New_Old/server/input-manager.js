const msg = require('./msg');
const fullTrim = require('./full-trim');

module.exports = class InputManager {
    constructor(socketServer, roomManager, stateObject) {
        this.io = socketServer;
        this.rMgr = roomManager;
        this.state = stateObject;
    }
    stringify(...input) {
        return input.join(' ').trim();
    }
    parse(strInput) {
        if (/^list$/i.test(strInput)) return this.showList();
        if (/^!+/.test(strInput)) return this.parseCommand(strInput);
        if (/^(is|check) *online$/.test(strInput)) return this.getOnlineStatus();
        if (/^(toggle|set) *online$/.test(strInput)) return this.toggleOnlineStatus();
        return this.notifyInputInvalid(strInput);
    }
    showList() {
        this.rMgr.refreshRooms();
        this.io.to('admin').send(msg('System', this.rMgr.getRooms().map(room => `${room.index}: ${room.author}` ).join('\n')));
        return null;
    }
    parseCommand(strInput) {
        const [index, ...msgContent] = strInput.substr(1).split(' ');
        if (isNaN(parseInt(index)) 
        || index < 0 
        || index >= this.rMgr.getRoomCount()
        || !msgContent
        || msgContent.length === 0) return this.notifyInputInvalid(strInput);
        const msgTrimmed = fullTrim(msgContent.join(' '));
        const msgObj = msg('Justin', msgTrimmed, this.rMgr.getRoom(parseInt(index)).author);
        this.io.to(this.rMgr.getRoom(parseInt(index)).id).to('admin').send(msgObj);
        return msgObj;
    }
    getOnlineStatus() {
        this.io.to('admin').send(msg('System', `You are currently ${this.state.isOnline ? 'online' : 'offline'}.`));
        return null;
    }
    toggleOnlineStatus() {
        this.state.isOnline = !this.state.isOnline;
        const msgObj = msg('System', `Justin is now ${this.state.isOnline ? 'online' : 'offline'}.`);
        this.io.send(msgObj);
        return msgObj;
    }
    notifyInputInvalid(str) {
        this.io.to('admin').send(msg('System', `Command "${str}" is invalid.`));
        return null;
    }
}