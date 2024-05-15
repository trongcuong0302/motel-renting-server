const express = require("express");
const router = express.Router();
const Feedback = require('../controller/feedbackController');
const handleResponse = require('../libs/handleResponse');

router.get("/", function(req, res) {
    const feedback = new Feedback();
    handleResponse(req, res, feedback.getAllItem);
});

router.get("/:id", function(req, res) {
    const feedback = new Feedback();
    handleResponse(req, res, feedback.getAnItem);
});

router.post("/", function(req, res) {
    const feedback = new Feedback();
    handleResponse(req, res, feedback.postAnItem);
});

router.put("/:id", function(req, res) {
    const feedback = new Feedback();
    handleResponse(req, res, feedback.updateItemById);
});

router.delete("/:id", function(req, res) {
    const feedback = new Feedback();
    handleResponse(req, res, feedback.deleteItemById);
});

module.exports = router;