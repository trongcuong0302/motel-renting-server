const express = require("express");
const router = express.Router();
const User = require('../controller/userController');
const handleResponse = require('../libs/handleResponse');
const jwt = require("jsonwebtoken");
require('dotenv').config();

router.post("/register", async function(req, res) {
    const user = new User();
    try {
        let data = await user.register(req);
        // const {_id} = data.data;
        // const token = jwt.sign({_id: _id}, process.env.JWT_SECRET);
        // res.cookie("jwt", token, {
        //     httpOnly: true,
        //     maxAge: 24*60*60*1000
        // });
        res.status(200).json({ message: 'Success' });
    } catch (error) {
        if (error.code) {
            res.status(error.code).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
});

router.post("/login", async function(req, res) {
    const user = new User();
    try {
        let data = await user.login(req);
        const token = jwt.sign({_id: data.data._id}, process.env.JWT_SECRET);
        res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: 24*60*60*1000
        });
        res.status(200).json({ message: 'Success' });
    } catch (error) {
        if (error.code) {
            res.status(error.code).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
});

router.get("/user", async function(req, res) {
    const user = new User();
    try {
        const cookie = req.rawHeaders.find(el => el.includes("jwt="))?.slice(4);
        const claims = cookie ? jwt.verify(cookie, process.env.JWT_SECRET) : null;
        
        if(!claims) {
            res.status(401).json({ message: 'Unauthenticated' });
        } else {
            const data = await user.getUser(claims);
            res.status(200).json(data);
        }
    } catch (error) {
        if (error.code) {
            res.status(error.code).json({ message: error.message });
        } else {
            res.status(500).json({ message: error.message });
        }
    }
});

router.post("/logout", function(req, res) {
    res.cookie("jwt", "", {maxAge:0})
    res.status(200).json({ message: 'Success' });
});

router.post("/send-email", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.sendEmail);
});

router.post("/verify-email", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.verifyEmail);
});

router.post("/reset-password", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.resetPassword);
});

router.post("/change-password", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.changePassword);
});

router.put("/:id", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.updateProfile);
});

router.get("/:id", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.getUser);
});

router.get("/", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.getAllItem);
});

router.delete("/:id", function(req, res) {
    const user = new User();
    handleResponse(req, res, user.deleteItemById);
});
module.exports = router;