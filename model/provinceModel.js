const baseModel = require('./baseModel');

class provinceModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('province');
    }
}

module.exports = provinceModel;