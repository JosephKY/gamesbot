const Discord = require('discord.js');
const userIsRegistered = require('../helpers/isregistered');
const Transaction = require('../models/transaction');
const User = require('../models/user');
const { Op } = require('sequelize');
const { incrementBalance } = require('../services/economy');


module.exports = {
    name: 'freemoney',
    data: new Discord.SlashCommandBuilder()
    .setName('freemoney')
    .setDescription("If you're short on cash, you can get $100 for free up to 5 times within 24 hours"),
    execute: async (client, interaction) => {
        try {
            await interaction.deferReply();

            // Count how many times the user has claimed in the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const claimsCount = await Transaction.count({
                where: {
                    userId: interaction.user.id,
                    type: 'freemoney',
                    created: {
                        [Op.gt]: twentyFourHoursAgo
                    }
                }
            });

            if (claimsCount >= 5) {
                // Find the oldest claim in the last 24 hours to calculate when they can claim again
                const oldestClaim = await Transaction.findOne({
                    where: {
                        userId: interaction.user.id,
                        type: 'freemoney',
                        created: {
                            [Op.gt]: twentyFourHoursAgo
                        }
                    },
                    order: [['created', 'ASC']]
                });

                const nextAvailable = new Date(oldestClaim.created.getTime() + 24 * 60 * 60 * 1000);
                const minutesLeft = Math.ceil((nextAvailable - Date.now()) / (60 * 1000));
                await interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setColor(15548997)
                        .setDescription(`❌ You've reached your free money claim limit`)
                        .setFooter({
                            'text': `You can claim again in ${minutesLeft} minute${minutesLeft == 1 ? '' : 's'}`
                        })
                    ]
                });
                return;
            }

            /*

            let newBal = (await User.increment(['balance'], {
                by: 100,
                where: {
                    'id': interaction.user.id
                }
            }))[0][0][0].balance;

            await Transaction.create({
                userId: interaction.user.id,
                type: 'freemoney',
                amount: 100,
                description: `Used the /freemoney command to claim $100 for free`,
                newBalance: newBal
            });

            */

            let newBal = await incrementBalance({
                userId: interaction.user.id,
                increment: 100,
                type: 'freemoney',
                description: 'Used the /freemoney command to claim $100 for free'
            })

            await interaction.editReply({
                embeds: [
                    new Discord.EmbedBuilder()
                    .setColor(5763719)
                    .setDescription(`💸 You now have $${newBal}`)
                    .setFooter({
                        'text': `${(5 - (claimsCount + 1))} use${(5 - (claimsCount + 1)) == 1 ? '' : 's'} remaining today`
                    })
                ]
            });
        } catch (e) {
            console.log(e);
        }
    }
};
