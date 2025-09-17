const Discord = require('discord.js');
const { queueAction } = require('../services/queue');
const affirmUser = require('../helpers/affirmuser');
const { getBalance, incrementBalance } = require('../services/economy');

module.exports = {
    name: 'transfer',
    data: new Discord.SlashCommandBuilder()
    .setName('transfer')
    .setDescription("Transfer money from your balance to another person's balance")
    .addUserOption(
        new Discord.SlashCommandUserOption()
        .setName('recipient')
        .setDescription('The user who will be receiving the money')
        .setRequired(true)
    )
    .addIntegerOption(
        new Discord.SlashCommandIntegerOption()
        .setName('amount')
        .setDescription('The amount of money that you are sending')
        .setRequired(true)
    ),
    execute: async (client, interaction) => {
        try {
            await queueAction(()=>{
                return interaction.deferReply()
            })

            let recipient = interaction.options.getUser('recipient');
            let amount = interaction.options.getInteger('amount');
            if(amount < 1){
                return await queueAction(()=>{
                    return interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setColor(15548997)
                            .setDescription(`❌ The amount to be transferred must be at least $1`)
                        ]
                    })
                })
            }

            let currentBal = await getBalance(interaction.user.id);
            if(currentBal < amount){
                return await queueAction(()=>{
                    return interaction.editReply({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setColor(15548997)
                            .setDescription(`❌ You attempted to transfer $${amount}, but you only have $${currentBal} in your balance`)
                        ]
                    })
                })
            }

            await affirmUser(recipient.id);
            let newBalUser = await incrementBalance({
                userId: interaction.user.id,
                increment: (amount * -1),
                type: 'transfer_out',
                description: `The amount was transferred out to <@${recipient.id}>`
            })
            let newBalRecipient = await incrementBalance({
                userId: recipient.id,
                increment: amount,
                type: 'transfer_in',
                description: `The amount was transferred in from <@${interaction.user.id}>`
            })

            return await queueAction(()=>{
                return interaction.editReply({
                    embeds: [
                        new Discord.EmbedBuilder()
                        .setColor(5763719)
                        .setDescription(`✅ $${amount} was successfully transferred to <@${recipient.id}>. Your balance is now $${newBalUser} and their balance is now $${newBalRecipient}`)
                    ]
                })
            })
        } catch (e) {
            console.log(e)
        }
    }
};
