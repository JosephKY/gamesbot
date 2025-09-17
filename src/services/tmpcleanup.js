const cleanOldTmpFiles = require("../helpers/cleantmp");

function cleanupTMP(){
    cleanOldTmpFiles()
    setTimeout(cleanupTMP, 3600000) // 1 hour
}

cleanupTMP()