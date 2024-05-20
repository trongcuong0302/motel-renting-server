const CRUD = require('./baseController');
const APIException = require('../libs/APIException');
const orderModel = require('../model/orderModel');
const userController = require('./userController');
const productController = require('./productController');

class orderController extends CRUD {
    constructor() {
        super();
        this.model = new orderModel();
    }

    getAllItem = async(req) => {
        //await this.sleep();
        let filter = JSON.parse(req.query.filter);
        const items = await this.model.findAll(filter);
        if (!items.data) {
            throw new APIException(400, "Can not find any items in the database")
        }
        for(let item of items.data) {
            let promises = [];
            promises.push(new userController().getUser({ _id: item.userId }))
            promises.push(new productController().getAnItem({ params: { id: item.motelId } }))
            let result = await Promise.all(promises);
            item.user = result[0].data;
            item.motel = result[1].data;
        }
        return items;
    }

    dataValidation = async(data) => {
        let requiredFields = ['motelId', 'userId', 'description', 'expiryDate', 'paymentList', 'vnpUrl'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate', 'isEdit'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = orderController;