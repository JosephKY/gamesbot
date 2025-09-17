const { db } = require("../services/db");

const CMDState = db.define("cmdstate", {
    'state': {
        type: db.Sequelize.TEXT,
        allowNull: false
    }
}, {
    'createdAt': 'created'
});

module.exports = CMDState