const CRUD = require('./baseController');
const categoryModel = require('../model/categoryModel');

class categoryController extends CRUD {
    constructor() {
        super();
        this.model = new categoryModel();
    }

    dataValidation = async(data) => {
        let requiredFields = ['categoryName', 'categoryCode'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        let queryDb = { key: "categoryCode", value: data.categoryCode };
        let findItem = await this.model.findAnItem(queryDb);
        if (findItem.data) {
            throw new APIException(400, "Duplicate Category Code");
        } else {
            return this.model.dataValidation(data, requiredFields, ignoredFields);
        }
    }
}

module.exports = categoryController;