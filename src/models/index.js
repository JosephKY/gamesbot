const fs = require('fs');
const path = require("path")

let modelSyncPromises = [];
const modelFileNames = fs.readdirSync(__dirname)
modelFileNames.forEach(modelFileName => {
    if (modelFileName === "index.js" || modelFileName === "example.model.js") return;
    console.log("Loading model: " + modelFileName);
    const model = require(path.join(__dirname, modelFileName))
    if(!model || Object.keys(model).length == 0){
        console.log("Model is empty")
        return;
    }
    modelSyncPromises.push(model.sync({
        alter: true
    }))
})

module.exports = { modelSyncPromises };