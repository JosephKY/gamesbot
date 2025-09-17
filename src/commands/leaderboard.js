const Discord = require('discord.js');
const { queueAction } = require('../services/queue');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const medalIndexes = ['🥇', '🥈', '🥉'];

module.exports = {
    name: 'leaderboard',
    data: new Discord.SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription("See who has the most amount of money in the economy"),
    execute: async (client, interaction) => {
        try {
            await queueAction(()=>{
                return interaction.deferReply()
            })
            let leaderboard = await User.findAll({
                limit: 15,
                order: [['balance', 'DESC']]
            })
            let embed = new Discord.EmbedBuilder()
            .setTitle('🏆 Leaderboard')
            .setColor(5793266)

            let houseText = `🏦 The House - `
            let houseSum = 0;
            let houseRecords = await Transaction.findAll({
                where: {
                    type: 'blackjack'
                },
                attributes: ['amount']
            })
            for(let record of houseRecords){
                houseSum += record.dataValues.amount * -1
            }
            houseText = houseText + `${houseSum < 0 ? '-' : ''}$${Math.abs(houseSum)}`

            let leaders = [];
            for(let userIndex in leaderboard){
                let user = leaderboard[userIndex];
                let medal = medalIndexes[userIndex];
                let text = `${medal !== undefined ? `${medal} ` : ''}${parseInt(userIndex) + 1}. <@${user.dataValues.id}> - $${user.dataValues.balance}`;
                leaders.push(text);
            }

            embed.setDescription(houseText + '\n\n' + leaders.join('\n'));

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
