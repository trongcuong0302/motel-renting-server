const baseModel = require('./baseModel');

class filterModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('filters');
    }
}

module.exports = filterModel;