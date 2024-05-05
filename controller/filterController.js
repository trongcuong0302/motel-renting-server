const CRUD = require('./baseController');
const APIException = require('../libs/APIException');
const filterModel = require('../model/filterModel');

class filterController extends CRUD {
    constructor() {
        super();
        this.model = new filterModel();
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
        let requiredFields = ['userId', 'list'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = filterController;