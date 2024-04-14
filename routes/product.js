const express = require("express");
const router = express.Router();
const Product = require('../controller/productController');
const handleResponse = require('../libs/handleResponse');

router.get("/", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.getAllItem);
});

router.get("/statistics", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.getProductStatistics);
});

router.get("/:id", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.getAnItem);
});

router.post("/", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.postAnItem);
});

router.put("/:id", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.updateItemById);
});

router.delete("/:id", function(req, res) {
    const product = new Product();
    handleResponse(req, res, product.deleteItemById);
});

module.exports = router;