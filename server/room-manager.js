module.exports = class RoomManager {
    constructor() {
        this.rooms = [];
    }
    createRoom(id, author = 'anonymous') {
        const index = this.rooms.length;
        this.rooms.push({ index, id, author, isActive: true });
        return this.rooms[index];
    }
    getRoom(index) { return this.rooms[index]; }
    getRooms() { return this.rooms; }
    getRoomCount() { return this.rooms.length; }
    updateRoomAuthor(index, author) { this.rooms[index].author = author; }
    deleteRoom(index) { this.rooms[index].isActive = false; }
    refreshRooms() { this.rooms = this.rooms.filter(room => room.isActive).map((room, index) => { room.index = index; return room; }); }
};