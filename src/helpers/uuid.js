function generateUUID() {
    const chars = '0123456789ABCDEF';
    let uuid = '';
    for (let i = 0; i < 6; i++) {
        uuid += chars[Math.floor(Math.random() * 16)];
    }
    return uuid;
}

module.exports = generateUUID;