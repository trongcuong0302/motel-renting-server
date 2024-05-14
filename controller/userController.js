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
                name: req.body.name,
                status: "inactive",
                role: req.body.role
            }
            await this.model.insertAnItem(user);
            await this.sendVerifyEmail( {email: user.email, lang: req.body.language} );
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
        } else if (user.data.status == "inactive") {
            throw new APIException(400, "Your account is inactive. Please verify your account in your email message.");
        }

        return user;
    }

    getUser = async(req) => {
        let id = req?.params?.id ?? req._id;
        let queryDb = { key: "_id", value: id };
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
        let subjectContent = req.body.language == "en" ? "Reset Password" : "Đặt lại mật khẩu"
        let htmlContent = req.body.language == "en" ? `<html>
                            <head><title>Password Reset Request</title></head>
                            <body>
                            <h1>Password Reset Request</h1>
                            <p>Dear ${user.data.name},</p>
                            <p>We have received a request to reset your password for your account with <strong>StayEase</strong>. To complete the password reset process, please click on the button below:</p>
                            <a href=${process.env.URL_WEB}/reset/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor:pointer; border-radius: 4px;">Reset Password</button></a>
                            <p>Please note that this link is only valid for 5 minutes. If you did not request a password reset, please disregard this message.</p>
                            <p>Thank you,</p>
                            <p>StayEase Develop Team</p>
                            </body>
                            </html>` : `<html>
            <head><title>Yêu cầu đặt lại mật khẩu</title></head>
            <body>
            <h1>Đặt lại mật khẩu</h1>
            <p>Xin chào ${user.data.name},</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu đăng nhập của bạn trong <strong>StayEase</strong>. Để đặt lại mật khẩu của bạn, hãy nhấn vào nút bên dưới:</p>
            <a href=${process.env.URL_WEB}/reset/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor:pointer; border-radius: 4px;">Đặt lại mật khẩu</button></a>
            <p>Hãy lưu ý rằng liên kết đã gửi cho bạn chỉ có hiệu lực trong 5 phút. Nếu bạn không gửi yêu cầu đặt lại mật khẩu, xin vui lòng bỏ qua email này.</p>
            <p>Trân trọng,</p>
            <p>Đội ngũ phát triển StayEase</p>
            </body>
            </html>`
        let mailDetails = {
            from: process.env.EMAIL_SEND,
            to: user.data.email,
            subject: subjectContent,
            html: htmlContent
        };
        await mailTransporter.sendMail(mailDetails, async(error, data) => {
            if(error){
                console.log(error);
                throw new APIException(500, "Something went wrong while sending the email");
            } else {
                user.data.token = token;
                const id = user.data._id;
                delete user.data._id;
                delete user.data.password;
                await this.model.updateById(id, user.data);
            }
        });
        
        return { message: 'Email sent successfully' };
    }

    sendVerifyEmail = async(req) => {
        let queryDb = { key: "email", value: req.email };
        let user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(404, "Email not found");
        }

        const payload = {
            email: user.data.email,
            phoneNumber: user.data.phoneNumber
        }
        const expiryTime = 999999999;
        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: expiryTime});

        const mailTransporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_SEND,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        let subject = req.lang == "en" ? "Account Verification" : "Xác thực tài khoản";
        let htmlContent = req.lang == "en" ? `<html>
                                                <head><title>Account Verification Request</title></head>
                                                <body>
                                                <h1>Account Verification Request</h1>
                                                <p>Dear ${user.data.name},</p>
                                                <p>We have received a request to register your account with <strong>StayEase</strong>. We have to verify whether the registered email address is your real email. To complete the email verification process, please click on the button below:</p>
                                                <a href=${process.env.URL_WEB}/verify/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor:pointer; border-radius: 4px;">Verify Account</button></a>
                                                <p>Please note that if you don't verify your email address, you cannot sign in to our website.</p>
                                                <p>Thank you,</p>
                                                <p>Develop Team</p>
                                                </body>
                                                </html>` : `<html>
                <head><title>Yêu cầu xác thực tài khoản</title></head>
                <body>
                <h1>Yêu cầu xác thực tài khoản</h1>
                <p>Xin chào ${user.data.name},</p>
                <p>Chúng tôi đã nhận được thông tin đăng ký của bạn vào <strong>StayEase</strong>. Chúng tôi phải xác thực địa chỉ email của bạn để hoàn tất đăng ký. Để hoàn tất quá trình xác thực, hãy nhấn vào nút bên dưới:</p>
                <a href=${process.env.URL_WEB}/verify/${token}><button style="background-color: #4CAF50; color: white; padding: 14px 20px; border: none; cursor:pointer; border-radius: 4px;">Xác thực tài khoản</button></a>
                <p>Xin lưu ý nếu bạn không xác thực tài khoản của mình, bạn không thể đăng nhập vào trang web.</p>
                <p>Trân trọng,</p>
                <p>Đội ngũ phát triển StayEase</p>
                </body>
                </html>`;
        let mailDetails = {
            from: process.env.EMAIL_SEND,
            to: user.data.email,
            subject: subject,
            html: htmlContent
        };
        await mailTransporter.sendMail(mailDetails, async(error, data) => {
            if(error){
                console.log(error);
                throw new APIException(500, "Something went wrong while sending the email");
            } else {
                user.data.verifyToken = token;
                const id = user.data._id;
                delete user.data._id;
                delete user.data.password;
                await this.model.updateById(id, user.data);
            }
        });
        
        return { message: 'Email sent successfully' };
    }

    verifyEmail = async(req) => {
        const token = req.body.token;
        let queryDb = { key: "verifyToken", value: token };
        const user = await this.model.findAnItem(queryDb);
        if (!user.data) {
            throw new APIException(404, "Your account has already been activated or it does not exist!");
        }
        let isExpired = false;
        jwt.verify(token, process.env.JWT_SECRET, async(err, data) => {
            if (err) {
                isExpired = true;
            } else {
                try { 
                    user.data.status = "active";
                    user.data.verifyToken = "";
                    const id = user.data._id;
                    delete user.data._id;
                    delete user.data.password;
                    await this.model.updateById(id, user.data);
                    return { message: 'Account verification success' };
                } catch (e) {
                    throw new APIException(500, "Something went wrong while verify account");
                }
            }
        });
        if(isExpired) throw new APIException(500, "Verification link is expired. Please send a new request to verify your account!");
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

    getAllItem = async(req) => {
        let filter = JSON.parse(req.query.filter);
        const items = await this.model.findAllUser(filter);
        if (!items.data) {
            throw new APIException(400, "Can not find any items in the database")
        }
        return items;
    }

}

module.exports = userController;