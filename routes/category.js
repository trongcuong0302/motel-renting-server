const express = require("express");
const router = express.Router();
const Category = require('../controller/categoryController');
const handleResponse = require('../libs/handleResponse');

router.get("/", function(req, res) {
    const category = new Category();
    handleResponse(req, res, category.getAllItem);
});

router.get("/:id", function(req, res) {
    const category = new Category();
    handleResponse(req, res, category.getAnItem);
});

router.post("/", function(req, res) {
    const category = new Category();
    handleResponse(req, res, category.postAnItem);
});

router.put("/:id", function(req, res) {
    const category = new Category();
    handleResponse(req, res, category.updateItemById);
});

router.delete("/:id", function(req, res) {
    const category = new Category();
    handleResponse(req, res, category.deleteItemById);
});

module.exports = router;