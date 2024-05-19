const CRUD = require('./baseController');
const APIException = require('../libs/APIException');
const orderModel = require('../model/orderModel');

class orderController extends CRUD {
    constructor() {
        super();
        this.model = new orderModel();
    }

    dataValidation = async(data) => {
        let requiredFields = ['motelId', 'userId', 'description', 'expiryDate', 'paymentList', 'vnpUrl'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate', 'isEdit'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = orderController;