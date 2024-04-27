const CRUD = require('./baseController');
const userModel = require('../model/userModel');
const APIException = require('../libs/APIException');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const nodemailer = require('nodemailer');

class userController extends CRUD {
    constructor() {
        super();
        this.model = new userModel();
    }

    register = async(req) => {
        let email = req.body.email;
        let phoneNumber = req.body.phoneNumber;
        email = await this.emailValidation(email);
        phoneNumber = await this.phoneValidation(phoneNumber)
        if(email) {
            let password = req.body.password;
            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
            let user = {
                email: email,
                password: password,
                phoneNumber: phoneNumber,
                name: req.body.name
            }
            await this.model.insertAnItem(user);
            let response = { data: user };
            return response;
        } else {
            throw new APIException(400, "Invalid data");
        }
    }

    login = async(req) => {
        let queryDb = req.body.email;
        let user = await this.model.findUserByPhoneOrEmail(queryDb);
        if (!user.data) {
            throw new APIException(404, "Not found email or phone number");
        } else if (!(await bcrypt.compare(req.body.password, user.data.password))) {
            throw new APIException(400, "Password is incorrect");
        }
        return user;
    }

    getUser = async(req) => {
        let queryDb = { key: "_id", value: req._id };
        let res = await this.model.findAnItem(queryDb);
        if (!res.data) {
            throw new APIException(404, "Not Found");
        }
        delete res.data.password;
        return res;
    }

    emailValidation = async(email) => {
        let queryDb = { key: "email", value: email };
        let findItem = await this.model.findAnItem(queryDb);
        if (findItem.data) {
            throw new APIException(400, "Duplicate Email");
        } else {
            return email;
        }
    }

    phoneValidation = async(phoneNumber) => {
        let queryDb = { key: "phoneNumber", value: phoneNumber };
        let findItem = await this.model.findAnItem(queryDb);
        if (findItem.data) {
            throw new APIException(400, "Duplicate phone number");
        } else {
            return phoneNumber;
        }
    }

    sendEmail = async(req) => {
        let queryDb = { key: "email", value: req.body.email };
        let user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(404, "Email not found");
        }

        const payload = {
            email: user.data.email
        }
        const expiryTime = 300;
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: expiryTime});

        const mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_SEND,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        let mailDetails = {
            from: process.env.EMAIL_SEND,
            to: user.data.email,
            subject: "Reset Password",
            html: `<html>
                <head><title>Password Reset Request</title></head>
                <body>
                <h1>Password Reset Request</h1>
                <p>Dear ${user.data.name},</p>
                <p>We have received a request to reset your password for your account with <strong>StayEase</strong>. To complete the password reset process, please click on the button below:</p>
                <a href=${process.env.URL_WEB}/reset/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor:pointer; border-radius: 4px;">Reset Password</button></a>
                <p>Please note that this link is only valid for 5 minutes. If you did not request a password reset, please disregard this message.</p>
                <p>Thank you,</p>
                <p>Develop Team</p>
                </body>
                </html>`
        };
        await mailTransporter.sendMail(mailDetails, async(error, data) => {
            if(error){
                console.log(error);
                throw new APIException(500, "Something went wrong while sending the email");
            } else {
                user.data.token = token;
                const id = user.data._id;
                delete user.data._id;
                await this.model.updateById(id, user.data);
            }
        });
        
        return { message: 'Email sent successfully' };
    }

    resetPassword = async(req) => {
        const token = req.body.token;
        const newPassword = req.body.password;
        let queryDb = { key: "token", value: token };
        const user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(500, "Reset link is expired. Please send a new request to reset your password!");
        }
        let isExpired = false;
        jwt.verify(token, process.env.JWT_SECRET, async(err, data) => {
            if (err) {
                isExpired = true;
            } else {
                const salt = await bcrypt.genSalt(10);
                const encryptedPassword = await bcrypt.hash(newPassword, salt);
                try { 
                    user.data.password = encryptedPassword;
                    user.data.token = "";
                    const id = user.data._id;
                    delete user.data._id;
                    await this.model.updateById(id, user.data);
                    return { message: 'Password reset success' };
                } catch (e) {
                    throw new APIException(500, "Something went wrong while reseting password");
                }
            }
        });
        if(isExpired) throw new APIException(500, "Reset link is expired. Please send a new request to reset your password!");
    }

    changePassword = async(req) => {
        let queryDb = { key: "email", value: req.body.email };
        let user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(404, "Not Found");
        }
        let oldPassword = req.body.oldPassword;
        if (!(await bcrypt.compare(oldPassword, user.data.password))) {
            throw new APIException(400, "Password is incorrect");
        }
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(req.body.newPassword, salt);
        try { 
            user.data.password = encryptedPassword;
            const id = user.data._id;
            delete user.data._id;
            await this.model.updateById(id, user.data);
            return { message: 'Password reset success' };
        } catch (e) {
            throw new APIException(500, "Something went wrong while reseting password");
        }
    }

    updateProfile = async(req) => {
        let updateData = req.body;
        let queryDb = { key: "_id", value: req.params.id };
        let user = await this.model.findAnItem(queryDb);
        if (!updateData.name && !updateData.isChangeAvatar) {
            throw new APIException(400, "Invalid data");
        }
        if (!user.data) {
            throw new APIException(404, "Not Found");
        }
        const id = user.data._id;
        for(let key of ['_id', 'email', 'password', 'isChangeAvatar']) {
            delete updateData[key];
        }
        await this.model.updateById(id, updateData);
        let res = { data: updateData };
        return res;
    }

    updateMotelListForUser = async(input) => {
        let queryDb = { key: "_id", value: input.userId };
        let user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(404, "Not Found");
        }
        const id = user.data._id;
        let motelList = user.data?.motelList ?? [];
        motelList.push(input.motelId);
        let updateData = { motelList: motelList }
        await this.model.updateById(id, updateData);
        let res = { data: updateData };
        return res;
    }

}

module.exports = userController;