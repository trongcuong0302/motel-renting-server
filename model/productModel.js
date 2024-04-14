const moment = require('moment');
const baseModel = require('./baseModel');

class productModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('products');
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