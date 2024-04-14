const express = require("express");
const router = express.Router();
const Province = require('../controller/provinceController');
const handleResponse = require('../libs/handleResponse');

router.get("/", function(req, res) {
    const province = new Province();
    handleResponse(req, res, province.getAllItem);
});

module.exports = router;