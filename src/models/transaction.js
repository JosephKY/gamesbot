const { db } = require("../services/db");

const Transaction = db.define("transaction", {
    'id': {
        type: db.Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    'userId': {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    'amount': {
        type: db.Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
    },
    'description': {
        type: db.Sequelize.STRING,
        defaultValue: null,
        allowNull: true
    },
    'newBalance': {
        type: db.Sequelize.BIGINT,
        allowNull: false
    },
    'type': {
        type: db.Sequelize.STRING,
        allowNull: true,
        defaultValue: null
    }
}, {
    'createdAt': 'created',
    'indexes': [
        {
            fields: [
                'userId'
            ]
        }
    ]
});

module.exports = Transaction