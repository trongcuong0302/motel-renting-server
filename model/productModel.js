const moment = require('moment');
const baseModel = require('./baseModel');

class productModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('products');
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
                    { roomName: { '$regex': item.value, '$options': 'i' } },
                    { address: { '$regex': item.value, '$options': 'i' } },
                    { "location.text": { '$regex': item.value, '$options': 'i' } },
                ];
            }

            //find exactly matching
            if (item.operator === 'matches') {
                if(item.field == 'location') queryDb["location.text"] = item.value;
                else if(item.field == 'owner') {
                    let qr = {'$or': [
                        { "renters._id": item.value },
                        { owner: item.value }
                    ]};
                    if(queryDb['$or'].length) {
                        let q = { '$or': queryDb['$or'] };
                        queryDb['$and'] = [q, qr];
                        delete queryDb['$or'];
                    } else queryDb['$or'] = qr['$or'];
                }
                else if(item.field == 'ownerId') {
                    queryDb['owner'] = item.value;
                }
                else if(item.field == 'renterId') {
                    queryDb["renters._id"] = item.value;
                }
                else queryDb[item.field] = item.value;
            }

            // find in range
            if (item.operator === 'range') {
                if (item.value) queryDb[item.field] = { $gte: item.value[0], $lte: item.value[1] };
            }

            // find more than
            if (item.operator === 'more') {
                if (item.value) queryDb[item.field] = { $gte: item.value };
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
        const dataArray = this.collection.find(queryDb).sort(sort).skip(response.pageIndex * response.pageSize).limit(response.pageSize).toArray();
        const total = this.collection.countDocuments(queryDb);
        let results = await Promise.all([dataArray, total]);

        // get data
        response.total = results[1];
        response.data = results[0];
        return response;
    }

    async getProductStatistics(req) {
        let data = {};
        let queryDb = {};
        // count product by time
        const date = new Date(req.query.date);
        const mode = req.query.mode;
        let startDate = '';
        let endDate = '';
        if (mode == 'date') {
            startDate = moment(date).startOf('day');
            endDate = moment(date).endOf('day');
        }
        if (mode == 'month') {
            startDate = moment(date).startOf('month');
            endDate = moment(date).endOf('month');
        }
        if (mode == 'year') {
            startDate = moment(date).startOf('year');
            endDate = moment(date).endOf('year');
        }
        queryDb = { createdDate: { $gte: new Date(startDate), $lt: new Date(endDate) } };
        let dataArray = await this.collection.find(queryDb).toArray();
        data.countProductByTime = dataArray.length;

        //count product by category
        data.countProductByCategory = 0;
        queryDb = { categoryCode: req.query.code };
        dataArray = await this.collection.find(queryDb).toArray();
        data.countProductByCategory = dataArray.length;

        return data;
    }

}

module.exports = productModel;