const { join } = require("path");
const { cwd } = require("process");
const fs = require('fs')

const tmpFolder = join(cwd(), 'tmp');
function cleanOldTmpFiles() {
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();

    if (!fs.existsSync(tmpFolder)) return;

    fs.readdirSync(tmpFolder).forEach(file => {
        const filePath = join(tmpFolder, file);
        try {
            const stats = fs.statSync(filePath);
            if (stats.isFile() && (now - stats.mtimeMs > THIRTY_MINUTES)) {
                fs.unlinkSync(filePath);
            }
        } catch (err) {
            console.error({
                message: 'Failed to clean tmp files!',
                error: err
            })
        }
    });
}

module.exports = cleanOldTmpFiles