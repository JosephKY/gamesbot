require("dotenv").config()
const { Sequelize } = require('sequelize');
const configDb = require('../configs/db');
console.log(configDb)
const db = 
new Sequelize(
    configDb.database,
    configDb.username,
    configDb.password,
    {
        host: configDb.host,
        port: configDb.port,
        dialect: configDb.dialect,
        logging: false,
        ssl: false,
    }
)

module.exports = { db, Sequelize }