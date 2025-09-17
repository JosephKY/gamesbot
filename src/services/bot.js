require("dotenv").config()
const Discord = require("discord.js");
const interactions = require("./interactions");
const { incrementBalance } = require("./economy");
const affirmUser = require("../helpers/affirmuser");

const client = new Discord.Client({
    partials: [
        Discord.Partials.Message,
        Discord.Partials.GuildMember,
        Discord.Partials.Message,
        Discord.Partials.Channel
    ],
    intents: [
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.MessageContent
    ]
});


client.once('ready', async () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    interactions.loadCommands(client)
});

client.on('interactionCreate', async (interaction) => {
    interactions.handleInteraction(client, interaction)
});

client.on('messageCreate', async message=>{
    if(!message.content.startsWith('-'))return;
    let content = message.content.slice(1, message.content.length);
    let splt = content.split(' ')
    let command = splt[0];
    if(message.author.id != '673556688875421720')return;
    if(command === 'incbalance'){
        let userId = splt[1];
        await affirmUser(userId);

        let amount = parseInt(splt[2])
        if(isNaN(amount))return;

        let newbal = await incrementBalance({
            userId: userId,
            increment: amount,
            type: 'admincontrol',
            description: `Admin ${message.author.id} manually incremented the user's balance`
        })

        await message.reply({
            content: `<@${userId}> was given $${amount}. Their balance is now $${newbal}`
        })
    }
})

client.login(process.env.DISCORD_TOKEN)

module.exports = {
    client
}