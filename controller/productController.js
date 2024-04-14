const CRUD = require('./baseController');
const productModel = require('../model/productModel');
const APIException = require('../libs/APIException');

class productController extends CRUD {
    constructor() {
        super();
        this.model = new productModel();
    }

    getProductStatistics = async(req) => {
        const items = await this.model.getProductStatistics(req);
        return items;
    }

    dataValidation = async(data) => {
        let requiredFields = ['productName', 'productCode', 'categoryCode', 'price'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        let queryDb = { key: "productCode", value: data.productCode };
        let findItem = await this.model.findAnItem(queryDb);
        if (findItem.data) {
            throw new APIException(400, "Duplicate Product Code");
        } else {
            return this.model.dataValidation(data, requiredFields, ignoredFields);
        }
    }
}

module.exports = productController;