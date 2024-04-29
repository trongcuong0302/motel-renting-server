const Database = require('../libs/dbConnection');
const mongo = require('mongodb');

class baseModel {
    constructor() {
        this.db = Database.getConnection();
        this.collection = '';
    }

    async findAll(filter) {
        //console.log(filter);

        let response = {};
        response.pageSize = 0;
        response.pageIndex = 0;
        let queryDb = {};
        let sort = {};
        filter.forEach(item => {
            //pagination
            if (item.field == 'pageSize' && item.operator == 'pagination') {
                response.pageSize = item.value;
            }

            if (item.field === 'pageIndex' && item.operator == 'pagination') {
                response.pageIndex = item.value - 1;
            }

            // search
            if (item.operator === 'includes') {
                queryDb[item.field] = { $regex: item.value };
            }

            // find less than
            if (item.operator === 'less') {
                if (item.value) queryDb[item.field] = { $lt: item.value };
            }

            // sort
            if (item.operator === 'sort' && item.field) {
                if (item.value === 'ascend') {
                    sort[item.field] = 1;
                }
                if (item.value === 'descend') {
                    sort[item.field] = -1;
                }
            }
        });

        // find data
        const dataArray = this.collection.find({}).skip(response.pageIndex * response.pageSize).limit(response.pageSize).sort(sort).toArray();
        const total = this.collection.countDocuments({});
        let results = await Promise.all([dataArray, total]);

        // get data
        response.total = results[1];
        response.data = results[0];
        return response;
    }

    async findAnItem(query) {
        let response = {};
        let queryDB = {}
        if (query.key === "_id") queryDB._id = mongo.ObjectId(query.value);
        else queryDB[query.key] = query.value;
        response.data = await this.collection.findOne(queryDB);
        delete response.data?.password;
        return response;
    }

    insertAnItem(data) {
        let date = new Date();
        data.createdDate = date;
        data.modifiedDate = date;
        return this.collection.insertOne(data);
    }

    updateById(id, data) {
        let date = new Date();
        data.modifiedDate = date;
        const updateDoc = { $set: data };
        return this.collection.updateOne({ _id: mongo.ObjectId(id) }, updateDoc);
    }

    deleteById(id) {
        return this.collection.deleteOne({ _id: mongo.ObjectId(id) });
    }

    dataValidation(data, requiredFields, ignoredFields) {
        let checkedData = {};
        for (const property in data) {
            if (requiredFields.includes(property) && !data[property]) {
                return false;
            }
            if (ignoredFields.includes(property)) continue;
            checkedData[property] = data[property];
        }
        return checkedData;
    }
}

module.exports = baseModel;