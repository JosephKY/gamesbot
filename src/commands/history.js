const Discord = require('discord.js');
const userIsRegistered = require('../helpers/isregistered');
const { transactionHistory, transactionHistoryMessagePayload } = require('../helpers/transhistory');
const { queueAction } = require('../services/queue');
const maxTransactionsPerPage = 5;

module.exports = {
    name: 'history',
    data: new Discord.SlashCommandBuilder()
    .setName('history')
    .setDescription("View the history of a user's gains and losses")
    .addUserOption(
        new Discord.SlashCommandUserOption()
        .setName('user')
        .setDescription('The user you wish to see the history of')
        .setRequired(true)
    ),
    execute: async (client, interaction) => {
        try {
            await queueAction(()=>{
                return interaction.deferReply();
            })
            let user = interaction.options.getUser('user')

            let isRegistered = await userIsRegistered(user.id);
            if(!isRegistered){
                await interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setColor(15548997)
                        .setDescription('❌ User has no history')
                    ]
                })
            }

            let history = await transactionHistory(user.id, 1, maxTransactionsPerPage)
            console.log(history)
            let messagePayload = transactionHistoryMessagePayload(history.data);
            console.log(messagePayload)

            await queueAction(()=>{
                return interaction.editReply(messagePayload)
            })
        } catch (e) {
            console.log(e)
        }
    }
};
