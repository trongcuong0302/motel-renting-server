const express = require('express');
var products = require('./routes/product');
var filters = require('./routes/filter');
var users = require('./routes/user');
var province = require('./routes/province');
var feedback = require('./routes/feedback');
const Database = require('./libs/dbConnection');

const start = async() => {
    const app = express();
    await Database.dbConnect();
    app.use(express.json());

    app.use(function(req, res, next) {
        //Enabling CORS
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Origin", "http://localhost:4200");
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-client-key, x-client-token, x-client-secret, Authorization");
        next();
    });

    app.use('/products', products);
    app.use('/filters', filters);
    app.use('/users', users);
    app.use('/province', province);
    app.use('/feedback', feedback);

    console.log("server started");
    app.listen(3000);

}

start();