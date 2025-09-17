const generateUUID = require("../helpers/uuid");

let retVals = {};
let queue = new Map();
let lastActions = [];

async function run(){
    let [actionUUID, action] = queue.entries()?.next()?.value || [undefined, undefined];
    if(actionUUID == undefined || action == undefined){
        setTimeout(run, 50);
        return;
    }
    let recentest = lastActions[0] || 99999;
    let recentless = lastActions[4] || 0;
    setTimeout(async ()=>{
        try {
            let ret = await action.method();
            let now = Date.now()
            retVals[actionUUID] = {
                completed: now,
                success: true,
                data: ret
            }
        } catch(e) {
            console.error({
                message: 'A queued action failed to run!',
                error: e
            })
            let now = Date.now()
            retVals[actionUUID] = {
                completed: now,
                success: false,
                data: e
            }
        } finally {
            let now = Date.now()
            queue.delete(actionUUID)
            lastActions.unshift(now)
            lastActions.slice(5, 1);
            setTimeout(run, 50)
        }
        
    }, (Math.max((5000 - (recentest - recentless)) + 300, 0)));
}

async function queueAction(method){
    return new Promise((resolve, reject) => {
        let actionUUID = generateUUID();
        let actionData = {
            method: method,
            uuid: actionUUID
        }
        queue.set(actionUUID, actionData);
        function wait(){
            let ret = retVals[actionUUID];
            if(ret){
                delete retVals[actionUUID];
                if(ret.success){
                    resolve(ret);
                } else {
                    reject(ret);
                }
            } else {
                setTimeout(wait, 50);
            }
        }
        wait();
        
        
    });
    
}

run()

module.exports = {
    queueAction
}