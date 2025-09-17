const User = require("../models/user")

function userIsRegistered(userId){
    return new Promise(async (resolve, reject) => {
        try {
            let user = await User.findOne({
                where: {
                    id: userId
                }
            });
            console.log(user)
            if(user === null){
                return resolve(false);
            }

            resolve(true);
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = userIsRegistered