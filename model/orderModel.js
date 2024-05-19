const baseModel = require('./baseModel');

class orderModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('orders');
    }
}

module.exports = orderModel;