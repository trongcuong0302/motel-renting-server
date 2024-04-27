const CRUD = require('./baseController');
const productModel = require('../model/productModel');
const APIException = require('../libs/APIException');
const userController = require('./userController');

class productController extends CRUD {
    constructor() {
        super();
        this.model = new productModel();
    }

    postAnItem = async(request) => {
        let checkedData = await this.dataValidation(request.body);
        if (checkedData) {
            let res = await this.model.insertAnItem(checkedData);
            let input = {
                motelId: res?.insertedId?.toString(),
                userId: checkedData.owner
            }
            await new userController().updateMotelListForUser(input);
            let response = { data: checkedData };
            return response;
        } else {
            throw new APIException(400, "Invalid data");
        }
    }

    getProductStatistics = async(req) => {
        const items = await this.model.getProductStatistics(req);
        return items;
    }

    dataValidation = async(data) => {
        let requiredFields = ['roomType', "roomName", "price", 'deposit', 'location', 'address'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = productController;