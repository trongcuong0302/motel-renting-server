const express = require("express");
const router = express.Router();
const Filter = require('../controller/filterController');
const handleResponse = require('../libs/handleResponse');

router.get("/", function(req, res) {
    const filter = new Filter();
    handleResponse(req, res, filter.getAllItem);
});

router.get("/:id", function(req, res) {
    const filter = new Filter();
    handleResponse(req, res, filter.getAnItem);
});

router.post("/", function(req, res) {
    const filter = new Filter();
    handleResponse(req, res, filter.postAnItem);
});

router.put("/:id", function(req, res) {
    const filter = new Filter();
    handleResponse(req, res, filter.updateItemById);
});

router.delete("/:id", function(req, res) {
    const filter = new Filter();
    handleResponse(req, res, filter.deleteItemById);
});

module.exports = router;