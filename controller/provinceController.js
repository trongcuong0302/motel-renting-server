const CRUD = require('./baseController');
const provinceModel = require('../model/provinceModel');

class provinceController extends CRUD {
    constructor() {
        super();
        this.model = new provinceModel();
    }
}

module.exports = provinceController;