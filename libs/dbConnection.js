const { MongoClient } = require('mongodb');

const URL = 'mongodb://root:root@127.0.0.1:27017';
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