const baseModel = require('./baseModel');

class orderModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('orders');
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
                queryDb['$or'] = [
                    { userId: item.value._id },
                    { motelId: { '$in': item.value.rentedMotelList || [] } }
                ];
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
        const dataArray = this.collection.find(queryDb).skip(response.pageIndex * response.pageSize).limit(response.pageSize).sort(sort).toArray();
        const total = this.collection.countDocuments(queryDb);
        let results = await Promise.all([dataArray, total]);

        // get data
        response.total = results[1];
        response.data = results[0];
        return response;
    }
}

module.exports = orderModel;