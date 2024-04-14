const baseModel = require('./baseModel');

class userModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('users');
    }

    async findUserByPhoneOrEmail(value) {
        let response = {};
        let queryDB = { 
            $or: [
                {email: value},
                {phoneNumber: value}
        ]}
        response.data = await this.collection.findOne(queryDB);
        return response;
    }
}

module.exports = userModel;