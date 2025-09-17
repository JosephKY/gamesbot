require("dotenv").config();

module.exports = {
    designatedGuildId: process.env.MODE === 'DEV' ? "704616349330309200" : "948709732066148422",
    legacyCommandPrefix: ".",
    debugGuildId: process.env.MODE === 'DEV' ? "704616349330309200" : "948709732066148422"
}