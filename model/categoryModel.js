const baseModel = require('./baseModel');

class categoryModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('categories');
    }
}

module.exports = categoryModel;