module.exports = class Error {
    constructor(code = 500, message = null) {
        this.code = code;
        this.message = message;
    }
}