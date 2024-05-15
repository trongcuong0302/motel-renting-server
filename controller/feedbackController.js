const CRUD = require('./baseController');
const APIException = require('../libs/APIException');
const feedbackModel = require('../model/feedbackModel');

class feedbackController extends CRUD {
    constructor() {
        super();
        this.model = new feedbackModel();
    }

    getAnItem = async(request) => {
        let queryDb = { key: "userId", value: request.params.id };
        const item = await this.model.findAnItem(queryDb);
        if (!item?.data) {
            throw new APIException(404, "Not Found");
        }
        return item;
    }

    dataValidation = async(data) => {
        let requiredFields = ['userId', 'userName', 'userEmail', 'userPhone', 'message', 'role'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = feedbackController;