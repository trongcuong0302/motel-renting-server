const { MongoClient } = require('mongodb');
require('dotenv').config();

const URL = process.env.MONGODB_URL;
const databaseName = 'manage_motel';
const client = new MongoClient(URL);

class Database {
    static database;

    static async dbConnect() {
        try {
            await client.connect();
            console.log('Connected');
            this.database = client.db(databaseName);
        } catch (err) {
            console.log(err);
        }
    }

    static getConnection() {
        return this.database;
    }
}

module.exports = Database;