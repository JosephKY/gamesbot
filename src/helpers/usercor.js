const corConfig = require("../configs/usercor");

function userCor(input){
    if(!input)return null;
    input = input.toLowerCase();
    input = input.trimEnd();
    input = input.trimStart();
    for(let [userId, nicknames] of Object.entries(corConfig.users)){
        if(nicknames.includes(input)){
            return userId;
        }
    }
    return null;
}

module.exports = userCor;