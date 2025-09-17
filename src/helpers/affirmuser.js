const User = require("../models/user");

function affirmUser(userId){
    return new Promise(async (resolve, reject) => {
        try {
            await User.findOrCreate({
                where: {
                    id: userId
                },
                defaults: {
                    id: userId
                }
            })

            resolve()
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = affirmUser