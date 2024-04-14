class APIException {
    constructor(code, message) {
        this.code = code;
        this.message = message;
    }

}

module.exports = APIException;