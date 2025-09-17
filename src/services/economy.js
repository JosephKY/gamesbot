const Transaction = require("../models/transaction");
const User = require("../models/user");

function getBalance(userId){
    return new Promise(async (resolve, reject) => {
        try {
            let user = await User.findOne({
                where: {
                    id: userId
                }
            });

            resolve(user?.dataValues.balance);
        } catch (e) {
            reject(e)
        }
    });
}

function incrementBalance({
    userId, 
    increment,
    type,
    description
}){
    return new Promise(async (resolve, reject) => {
        try {
            let newBal = (await User.increment(['balance'], {
                by: increment,
                where: {
                    'id': userId
                }
            }))[0][0][0].balance;

            await Transaction.create({
                userId: userId,
                type: type,
                description: description,
                amount: increment,
                newBalance: newBal
            })

            resolve(newBal);
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = {
    getBalance,
    incrementBalance
}