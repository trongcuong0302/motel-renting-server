const express = require("express");
const router = express.Router();
const Order = require('../controller/orderController');
const handleResponse = require('../libs/handleResponse');
const moment = require('moment');

router.get("/", function(req, res) {
    const order = new Order();
    handleResponse(req, res, order.getAllItem);
});

router.post("/", function(req, res) {
    const order = new Order();
    handleResponse(req, res, order.postAnItem);
});

router.put("/:id", function(req, res) {
    const order = new Order();
    handleResponse(req, res, order.updateItemById);
});

router.delete("/:id", function(req, res) {
    const order = new Order();
    handleResponse(req, res, order.deleteItemById);
});

router.post('/create_payment_url', async function (req, res, next) {
    
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    let expireDate = moment(req.body.expiryDate).format('YYYYMMDDHHmmss');
    
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    let config = require('config');
    
    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');
    let vnpUrl = config.get('vnp_Url');
    let returnUrl = config.get('vnp_ReturnUrl');
    let orderId = uuidv4();
    let amount = req.body.amount;
    let bankCode = req.body.bankCode;
    
    let locale = req.body.language;
    if(locale === null || locale === '' || !locale){
        locale = 'vn';
    }
    let currCode = 'VND';
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = locale;
    vnp_Params['vnp_CurrCode'] = currCode;
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = `${req.body.description} ${orderId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = expireDate;
    if(bankCode !== null && bankCode !== '' && bankCode){
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    vnp_Params = sortObject(vnp_Params);

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");     
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex"); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    const order = new Order();
    try {
        req.body['vnpUrl'] = vnpUrl;
        req.body['status'] = 'unpaid';
        req.body['vnp_TxnRef'] = orderId;
        if(!req.body.isEdit) {
            const data = await order.postAnItem(req);
            res.status(200).json(data);
        } else {
            req.params['id'] = req.body._id;
            const data = await order.updateItemById(req);
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

router.get('/vnpay_return', async function (req, res, next) {
    let vnp_Params = JSON.parse(req.query.vnp_Params);

    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let config = require('config');
    let tmnCode = config.get('vnp_TmnCode');
    let secretKey = config.get('vnp_HashSecret');

    let querystring = require('qs');
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let crypto = require("crypto");     
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");     
    
    if(secureHash === signed){
        //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
        try {
            const order = new Order();
            let bill = await order.getAnItem({params: {id: vnp_Params['vnp_TxnRef']}});
            if(vnp_Params['vnp_ResponseCode'] == '00') bill.data['status'] = 'paid';
            bill.data['payDate'] = vnp_Params['vnp_PayDate'];
            
            let updateObject = {
                body: bill.data,
                params: {
                    id: bill.data._id.toString(),
                }
            }

            await order.updateItemById(updateObject);

            res.status(200).json( {code: vnp_Params['vnp_ResponseCode'], data: bill.data} )
        } catch (error) {
            if (error.code) {
                res.status(error.code).json({ message: error.message });
            } else {
                res.status(500).json({ message: error.message });
            }
        }
        
    } else{

        try {
            const order = new Order();
            let bill = await order.getAnItem({params: {id: vnp_Params['vnp_TxnRef']}});
            
            let updateObject = {
                body: bill.data,
                params: {
                    id: bill.data._id.toString(),
                }
            }

            await order.updateItemById(updateObject);

            res.status(200).json( {code: '97', data: bill.data} );
        } catch (error) {
            if (error.code) {
                res.status(error.code).json({ message: error.message });
            } else {
                res.status(500).json({ message: error.message });
            }
        }
        
    }
});

router.get("/:id", function(req, res) {
    const order = new Order();
    handleResponse(req, res, order.getAnItem);
});

function uuidv4() {
    let crypto = require("crypto");   
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

function sortObject(obj) {
	let sorted = {};
	let str = [];
	let key;
	for (key in obj){
		if (obj.hasOwnProperty(key)) {
		str.push(encodeURIComponent(key));
		}
	}
	str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

module.exports = router;