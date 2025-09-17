const Discord = require('discord.js');
const { queueAction } = require('../services/queue');
const { getBalance } = require('../services/economy');

module.exports = {
    name: 'balance',
    data: new Discord.SlashCommandBuilder()
    .setName('balance')
    .setDescription("See the current balance for yourself or another person")
    .addUserOption(
        new Discord.SlashCommandUserOption()
        .setName('user')
        .setDescription('The user you wish to see the current balance of. Leave blank to see your own balance')
        .setRequired(false)
    ),
    execute: async (client, interaction) => {
        try {
            await queueAction(()=>{
                return interaction.deferReply();
            })
            let user = interaction.options.getUser('user') || interaction.user;
            let balance = await getBalance(user.id);
            let embed = new Discord.EmbedBuilder();
            if(!balance){
                embed
                .setColor(15548997)
                .setDescription(`❔ <@${user.id}> has no balance`)
            } else {
                embed
                .setColor(5793266)
                .setDescription(`💵 <@${user.id}>'s balance is **$${balance}**`)
            }
            await queueAction(()=>{
                return interaction.editReply({
                    embeds: [
                        embed
                    ]
                })
            })
        } catch (e) {
            console.log(e)
        }
    }
};
