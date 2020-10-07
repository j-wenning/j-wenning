const StateObject = require('./state-object');
const RoomManager = require('./room-manager');
const InputManager = require('./input-manager');
const uriParser = require('./uri-parser');
const msg = require('./msg');


const isAdmin = (socket, sessionManager) => !!sessionManager.getSession(uriParser(socket.handshake.query.cookie).id).isAdmin;
const onAdminConnect = (socket, inputManager, logManager) => {
    socket.join('admin');
    socket.on('message', data => {
        logManager.recordItem(inputManager.parse(inputManager.stringify(data)));
    });
}
const onUserConnect = (io, socket, roomManager, logManager, stateObject) => {
    const room = roomManager.createRoom(socket.id, socket.handshake.query.author);
    io.to(socket.id).send(msg('System', `Justin is currently ${stateObject.isOnline ? 'online' : 'offline'}.`));
    socket.on('message', data => {
        logManager.recordItem(data);
        io.to('admin').send(data);
    });
    socket.on('nameChange', data => {
        const msgObj = msg('System', `User "${room.author}" has changed their name to "${data.author}".`);
        logManager.recordItem(msgObj);
        io.to('admin').send(msgObj);
        roomManager.updateRoomAuthor(room.index, data.author);
    });
    socket.on('disconnect', () => roomManager.deleteRoom(room.index));
}

class SocketManager {
    constructor(socketServer, sessionManager, logManager) {
        this.io = socketServer;
        this.sessionManager = sessionManager;
        this.logManager = logManager;
        this.stateObject = new StateObject();
        this.roomManager = new RoomManager();
        this.inputManager = new InputManager(socketServer, this.roomManager, this.stateObject);
        this.io.on('connect', socket => {
            if (isAdmin(socket, sessionManager)) onAdminConnect(socket, this.inputManager, this.logManager);
            else onUserConnect(socketServer, socket, this.roomManager, this.logManager, this.stateObject);
        });
    }
};

module.exports = (socketServer, sessionManager, logManager) => new SocketManager(socketServer, sessionManager, logManager);