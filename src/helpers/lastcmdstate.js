const CMDState = require("../models/cmdstate");

function lastCMDState(){
    return new Promise(async (resolve, reject) => {
        try {
            let row = await CMDState.findOne({
                order: [
                    ['created', 'DESC']
                ]
            });
            resolve(row)
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = lastCMDState