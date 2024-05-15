const baseModel = require('./baseModel');

class feedbackModel extends baseModel {
    constructor() {
        super();
        this.collection = this.db.collection('feedback');
    }
}

module.exports = feedbackModel;