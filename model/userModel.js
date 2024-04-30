const baseModel = require('./baseModel');

class userModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('users');
    }

    async findUserByPhoneOrEmail(value) {
        let response = {};
        let queryDB = { 
            $or: [
                {email: value},
                {phoneNumber: value}
        ]}
        response.data = await this.collection.findOne(queryDB);
        return response;
    }

    async findAllUser(filter) {
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
                    { email: { '$regex': item.value, '$options': 'i' } },
                    { phoneNumber: { '$regex': item.value, '$options': 'i' } },
                    { name: { '$regex': item.value, '$options': 'i' } },
                ];
            }

            if (item.operator === 'matches') {
                queryDb[item.field] = item.value;
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
        if(response.total) response.data.forEach(item => {
            delete item.password;
        })
        return response;
    }
}

module.exports = userModel;