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

    deleteItemById = async(request) => {
        const motel = await this.getAnItem(request);
        const user = await new userController().getUser({ _id : motel.data.owner });
        let index = -1;
        if(user.data.motelList && user.data.motelList.length) {
            index = user.data.motelList.findIndex(item => item == request.params.id)
        }
        if(index >= 0) user.data.motelList.splice(index, 1);
        let updateObject = {
            body: user.data,
            params: {
                id: user.data._id.toString(),
            }
        }
        const updateData = new userController().updateProfile(updateObject);
        const item = this.model.deleteById(request.params.id);
        let response = await Promise.all([updateData, item])
        if (response[1].deletedCount) {
            let message = { message: `Document with id ${request.params.id} has been deleted` };
            return message;
        } else {
            throw new APIException(404, "Not Found");
        }
    }

    getProductStatistics = async(req) => {
        const items = await this.model.getProductStatistics(req);
        return items;
    }

    dataValidation = async(data) => {
        let requiredFields = ['roomType', 'roomType', "roomName", "price", 'deposit', 'location', 'address'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = productController;