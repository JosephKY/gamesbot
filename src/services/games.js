const { EmbedBuilder } = require("@discordjs/builders");
const generateUUID = require("../helpers/uuid");
const { blackjackCreationHandler, blackjackInteractionHandler } = require("./games/blackjack");
const { queueAction } = require("./queue");

class Game {
    static games = {};
    static discordOptions = [];

    constructor({
        identifier,
        title,
        description,
        minPlayers,
        maxPlayers,
        minBet,
        maxBet,
        interactionHandler,
        creationHandler
    }){
        this.identifier = identifier;
        this.title = title;
        this.description = description;
        this.minPlayers = minPlayers;
        this.maxPlayers = maxPlayers;
        this.minBet = minBet;
        this.maxBet = maxBet;
        this.interactionHandler = interactionHandler;
        this.creationHandler = creationHandler;

        Game.games[identifier] = this;
        Game.discordOptions.push({
            'name': title,
            'value': identifier
        })
    }

    play({
        creationInteraction
    }){
        new ActiveGame(
            this,
            creationInteraction
        )
    }
}

class ActiveGame {
    static games = {};

    constructor(rootGame, creationInteraction){
        queueAction(()=>{
            return creationInteraction.deferReply();
        })
        .then(()=>{
            let now = Date.now();
            this.uuid = generateUUID();
            this.data = {
                meta: {
                    rootGame: rootGame,
                    created: {
                        time: now,
                        interaction: creationInteraction,
                        user: creationInteraction.user
                    },
                    lastInteraction: {
                        time: now,
                        interaction: creationInteraction,
                        user: creationInteraction.user
                    },
                    processing: false,
                    uuid: this.uuid
                },
                data: {}
            }

            ActiveGame.games[this.uuid] = this;
            this.data.meta.rootGame.creationHandler({interaction: creationInteraction, game: this}) 
        })
        .catch(e=>{
            console.log({
                message: 'Catostrophic error while handling game creation!',
                interaction: creationInteraction,
                error: e
            })
        })
    }

    customId(parts){
        return `game.${this.uuid}.${parts.join('.')}`;
    }

    handleInteraction(interaction){
        return this.data.meta.rootGame.interactionHandler({interaction, game: this})
    }

    updateData(data){
        this.data.data = data;
    }

    static async handleInteraction(interaction){
        try {
            let splt = interaction.customId.split('.');
            let gameId = splt[1];
            let activeGame = ActiveGame.games[gameId];
            if(!activeGame){
                return queueAction(()=>{
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setDescription("🤷‍♀️ The game you attempted to interact with no longer exists")
                            .setColor(15548997)
                        ],
                        ephemeral: true
                    })
                })
            }
            if(activeGame.data.meta.processing === true){
                return queueAction(()=>{
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setDescription("🛂 The game you attempted to interact with is already processing another action")
                            .setColor(15548997)
                        ],
                        ephemeral: true
                    })
                })
            }
            activeGame.data.meta.processing = true;
            await activeGame.handleInteraction(interaction);
            activeGame.data.meta.processing = false;
            activeGame.data.meta.lastInteraction = {
                time: Date.now(),
                interaction: interaction,
                user: interaction.user
            }
        } catch (e) {
            console.error({
                message: 'Catostrophic error while handling a games interaction!',
                interaction: interaction,
                error: e
            })
        }
    }
}

new Game({
    identifier: 'bj',
    title: 'Blackjack',
    description: 'Get as close to 21 as possible in a hand of cards without going over',
    minPlayers: 1,
    maxPlayers: 1,
    minBet: 5,
    maxBet: undefined,
    creationHandler: blackjackCreationHandler,
    interactionHandler: blackjackInteractionHandler
})

module.exports = {
    Game,
    ActiveGame
}