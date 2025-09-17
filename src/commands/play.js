const Discord = require('discord.js');
const serviceGames = require("../services/games");
const { queueAction } = require('../services/queue');

module.exports = {
    name: 'play',
    data: new Discord.SlashCommandBuilder()
    .setName('play')
    .setDescription("Start a new game")
    .addStringOption(
        new Discord.SlashCommandStringOption()
        .setName('game')
        .setDescription('The game that you wish to play')
        .setRequired(true)
        .setChoices(serviceGames.Game.discordOptions)
    ),
    execute: async (client, interaction) => {
        try {
            let gameId = interaction.options.getString('game');
            let game = serviceGames.Game.games[gameId];
            if(!game){
                return queueAction(()=>{
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setDescription("🤷‍♀️ The game that you attempted to play does not exist")
                            .setColor(15548997)
                        ]
                    })
                })
            }
            game.play({
                creationInteraction: interaction
            })
        } catch (e) {
            console.log(e)
        }
    }
};
