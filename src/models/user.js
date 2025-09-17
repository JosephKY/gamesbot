const { db } = require("../services/db");

const User = db.define("user", {
    'id': {
        type: db.Sequelize.STRING,
        primaryKey: true,
    },
    'balance': {
        type: db.Sequelize.BIGINT,
        defaultValue: 1000,
        allowNull: false
    },
    'banned': {
        type: db.Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    'createdAt': 'created'
});

module.exports = User