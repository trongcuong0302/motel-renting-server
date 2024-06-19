const CRUD = require('./baseController');
const productModel = require('../model/productModel');
const APIException = require('../libs/APIException');
const userController = require('./userController');

class productController extends CRUD {
    constructor() {
        super();
        this.model = new productModel();
    }

    getAnItem = async(request) => {
        let queryDb = { key: "_id", value: request.params.id };
        const item = await this.model.findAnItem(queryDb);
        if (!item.data) {
            if(request.params.fromOrder) {
                return null;
            }
            else throw new APIException(404, "Not Found");
        }
        return item;
    }

    postAnItem = async(request) => {
        let checkedData = await this.dataValidation(request.body);
        if (checkedData) {
            let res = await this.model.insertAnItem(checkedData);
            let input = {
                motelId: res?.insertedId?.toString(),
                userId: checkedData.owner
            }
            let promises = [];
            if(checkedData.renters && checkedData.renters.length) {
                for(let renter of checkedData.renters) {
                    let inputRenter = {
                        motelId: res?.insertedId?.toString(),
                        userId: renter._id
                    }
                    promises.push(new userController().updateMotelListForRenter(inputRenter))
                }
            }
            promises.push(new userController().updateMotelListForUser(input));
            await Promise.all(promises);
            let response = { data: checkedData };
            return response;
        } else {
            throw new APIException(400, "Invalid data");
        }
    }

    updateItemById = async(request) => {
        let checkedData = await this.dataValidation(request.body);

        if (checkedData) {
            if(checkedData.oldRenters && checkedData.renters) {
                await this.updateRenterProfile( { old: checkedData.oldRenters, new: checkedData.renters, roomId: request.params.id } )
            }
            delete checkedData.oldRenters;
            const item = await this.model.updateById(request.params.id, checkedData);
            if (item.matchedCount) {
                let response = { data: checkedData };
                return response;
            } else {
                throw new APIException(404, "Not Found");
            }
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

    updateRenterProfile = async(req) => {
        let old = req.old;
        let newRenters = req.new;
        let leave = [];

        for (let i = 0; i < old.length; i++) {
            let index = newRenters.findIndex((item) => item._id == old[i]._id);
            if(index < 0) {
                let id = old[i].rentedMotelList.findIndex((item) => item == req.roomId);
                if(id >= 0) old[i].rentedMotelList.splice(id, 1);
                let obj = {};
                for(let key in old[i]) {
                    obj[key] = old[i][key];
                }
                let updateObject = {
                    body: obj,
                    params: {
                        id: old[i]._id.toString(),
                    }
                }
                await (new userController().updateProfile(updateObject));
            }
        }

        for (let i = 0; i < newRenters.length; i++) {
            let index = old.findIndex((item) => item._id == newRenters[i]._id);

            if(index < 0) {
                let obj = { };
                for(let key in newRenters[i]) {
                    obj[key] = newRenters[i][key];
                }
                
                if(!obj.rentedMotelList || !obj.rentedMotelList.length) obj.rentedMotelList = [];
                obj.rentedMotelList.push(req.roomId)

                let updateObject = {
                    body: obj,
                    params: {
                        id: obj._id.toString(),
                    }
                }
                await (new userController().updateProfile(updateObject));
            }
        }
    }

    dataValidation = async(data) => {
        let requiredFields = ['roomType', 'roomStatus', "roomName", "price", 'deposit', 'location', 'address'];
        let ignoredFields = ['_id', 'modifiedDate', 'createdDate'];
        return this.model.dataValidation(data, requiredFields, ignoredFields);
    }
}

module.exports = productController;