const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder } = require("@discordjs/builders");
const { queueAction } = require("../queue");
const { ButtonStyle, TextInputStyle, Embed } = require("discord.js");
const getShuffledDeck = require("../../helpers/cards");
const { getBalance, incrementBalance } = require("../economy");
const { generateBlackjackNewgame, generateBlackjackGame } = require("../images");
const randomItem = require("../../helpers/randarr");
const isBlackjack = require("../../helpers/isblackjack");
const calculateDealerHandSum = require("../../helpers/dealersum");
const classicalValues = {
    'K': 10,
    'Q': 10,
    'J': 10,
    'T': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2
} 
let inactivityTimes = {};

async function handleGame(interaction, game, action){
    let msgPayload;
    let data = game.data.data;

    //inactivityTimes[game.data.meta.uuid] = Date.now() + 300000;

    function allPlayerHandsResolved(){
        for(let hand of data.playerHands){
            if(hand.status == 'ongoing'){
                return false;
            }
        }
        return true;
    }

    function stepDealerResolveForward(){
        if(data.dealerHand.cards[1].rank === undefined){
            data.dealerHand.cards[1] = randomItem(data.deck, true)
        } else {
            data.dealerHand.cards.push(randomItem(data.deck, true))
        }
    }

    function allPlayerHandsBust(){
        for(let hand of data.playerHands){
            if(hand.status != 'bust'){
                return false;
            }
        }
        return true;
    }

    let availstate = false;
    function resolveAvailableActions(){
        let buttons = [];
        if(allPlayerHandsResolved()){
            if(calculateDealerHandSum(data.dealerHand.cards) < 17 && !allPlayerHandsBust()){
                buttons.push(
                    new ButtonBuilder()
                    .setCustomId(game.customId(['dealer']))
                    .setLabel('Next Dealer Card')
                    .setStyle(ButtonStyle.Primary)
                )
                availstate = 'nextdealer'
            } else {
                buttons.push(
                    new ButtonBuilder()
                    .setCustomId(game.customId(['newgame']))
                    .setLabel('New Game')
                    .setStyle(ButtonStyle.Primary)
                )
                availstate = 'gameover'
            }
        } else {
            for(let playerHandIndex in data.playerHands){
                let playerHand = data.playerHands[playerHandIndex];
                playerHandIndex = parseInt(playerHandIndex)
                if(playerHand.status != 'ongoing')continue;
                let onlyHand = data.playerHands.length == 1;

                buttons.push(
                    new ButtonBuilder()
                    .setLabel(onlyHand ? 'Stand' : `Stand Hand ${playerHandIndex + 1}`)
                    .setCustomId(game.customId(['stand', playerHandIndex]))
                    .setStyle(ButtonStyle.Primary)
                )

                if(!isBlackjack(playerHand.cards)){
                    buttons.push(
                        new ButtonBuilder()
                        .setLabel(onlyHand ? 'Hit' : `Hit Hand ${playerHandIndex + 1}`)
                        .setCustomId(game.customId(['hit', playerHandIndex]))
                        .setStyle(ButtonStyle.Primary)
                    )
                }

                if(playerHand.cards[0].rank === playerHand.cards[1].rank && playerHand.cards.length == 2){
                    buttons.push(
                        new ButtonBuilder()
                        .setLabel(onlyHand ? 'Split' : `Split Hand ${playerHandIndex + 1}`)
                        .setCustomId(game.customId(['split', playerHandIndex]))
                        .setStyle(ButtonStyle.Primary)
                    )
                }
            }
        }
        return buttons;
    }

    if(action === 'inactivity_response'){
        let currentEmbed = interaction.message.embeds[0];
        console.log(currentEmbed)
        console.log('EMBEDIMAGE: ', currentEmbed.image.url)
        let totalBet = 0;
        data.playerHands.forEach(hand=>{
            totalBet += hand.bet;
        })

        await incrementBalance({
            userId: game.data.meta.created.user.id,
            description: 'User abandoned a blackjack game and lost their bet',
            type: 'blackjack',
            increment: totalBet * -1
        })

        await queueAction(()=>{
            return interaction.message.edit({
                components: [],
                embeds: [
                    new EmbedBuilder()
                    .setColor(3311670)
                    .setDescription(`${game.data.meta.created.user.username} abandoned the game and lost their bet`)
                    .setImage(`attachment://${data.lastImageData.fileName}`)
                ],
                files: [data.lastImageData.filePath]
            })
        })
        return;
    }

    inactivityTimes[game.data.meta.uuid] = {
        time: Date.now() + 300000,
        game
    }

    if(action === 'makebet'){
        let bet = parseInt(interaction.fields.getTextInputValue('bet'))
        let balance = await getBalance(interaction.user.id);
        if(isNaN(bet)){
            msgPayload = 'Provided bet is not a valid number. Please try again';
        }

        if(bet > balance){
            msgPayload = "Provided bet is more than your current balance. Please try again. If you're short on cash, try using the **/freemoney** command"
        }

        if(bet < game.data.meta.rootGame.minBet){
            msgPayload = `Provided bet is less than the game's minimum bet, which is $${game.data.meta.rootGame.minBet}. Please try again`
        }

        if(msgPayload !== undefined){
            return {
                msgPayload,
                data
            }
        } 

        let newGameData = {
            deck: getShuffledDeck(),
            dealerHand: {
                cards: [],
                status: 'ongoing'
            },
            playerHands: [
                {
                    cards: [],
                    bet: bet,
                    status: 'ongoing'
                }
            ],
            mainMessage: interaction.message
        }

        let dealerCard = randomItem(newGameData.deck, true);
        newGameData.dealerHand.cards.push(dealerCard)
        newGameData.dealerHand.cards.push({
            rank: undefined,
            suit: undefined
        })

        let playerFirstCard = randomItem(newGameData.deck, true);
        let playerSecondCard = randomItem(newGameData.deck, true);
        newGameData.playerHands[0].cards.push(playerFirstCard)
        newGameData.playerHands[0].cards.push(playerSecondCard);

        data = newGameData;
    }

    let targetHandIndex = parseInt(interaction.customId.split('.')[3]) || 0;
    let actionText = 'Make your move...';
    if(action === 'stand'){
        data.playerHands[targetHandIndex].status = 'stood'
        actionText = `*${interaction.user.username} stands...*`
    }
    if(action === 'hit'){
        data.playerHands[targetHandIndex].cards.push(randomItem(data.deck, true))
        
        let handValues = [0,0];
        data.playerHands[targetHandIndex].cards.forEach(card=>{
            if(card.rank === 'A'){
                handValues[0] += 1;
                handValues[1] += 11;
            } else {
                handValues[0] += classicalValues[card.rank];
                handValues[1] += classicalValues[card.rank];
            }
        })
        if(handValues[0] > 21){
            data.playerHands[targetHandIndex].status = 'bust';
        }

        actionText = `*${interaction.user.username} hits...*`
    }
    if(action === 'split'){
        let balance = await getBalance(interaction.user.id);
        let handBet = data.playerHands[targetHandIndex].bet
        for(let hand of data.playerHands){
            balance = balance - hand.bet // adjust balance for current state
        }
        balance = balance - handBet // adjust balance again for if they split
        if(data.playerHands.length == 3){
            actionText = `*${interaction.user.username} tried to split, but they've already reached the maximum of 3 hands...*`
        } else if(balance < 0){
            actionText = `*${interaction.user.username} tried to split, but they can't afford to make another $${handBet} bet...*`
        } else {
            let newDeckIndex = data.playerHands.length;
            data.playerHands[newDeckIndex] = {
                bet: handBet,
                status: 'ongoing',
                cards: [
                    data.playerHands[targetHandIndex].cards.pop(),
                    randomItem(data.deck, true)
                ]
            }
            data.playerHands[targetHandIndex].cards.push(randomItem(data.deck, true))
            actionText = `*${interaction.user.username} splits...*`
        }
    }

    if(allPlayerHandsResolved()){
        stepDealerResolveForward()
    }

    

    let buttons = resolveAvailableActions();
    if(availstate == 'gameover'){
        delete inactivityTimes[game.data.meta.uuid];
        actionText = '**Game over!**'
        let balanceIncrement = 0;
        let dealerSum = calculateDealerHandSum(data.dealerHand.cards);
        data.playerHands.forEach(hand=>{
            let handSum = calculateDealerHandSum(hand.cards);
            console.log(`PLAYER SUM: ${handSum}, DEALER SUM: ${dealerSum}`)
            if((handSum < dealerSum && (dealerSum <= 21)) || handSum > 21){
                balanceIncrement -= hand.bet;
            } else if(handSum > dealerSum && (handSum <= 21) || dealerSum > 21){
                balanceIncrement += hand.bet;
            }
        })
        actionText += `\n${interaction.user.username} ${balanceIncrement === 0 ? 'did not lose or make any money' : (balanceIncrement < 0 ? `lost $${Math.abs(balanceIncrement)}` : `earned $${balanceIncrement}`)}`
        await incrementBalance({
            userId: interaction.user.id,
            increment: balanceIncrement,
            type: 'blackjack',
            description: 'The result of a blackjack game was decided',
        })
    } else if(availstate == 'nextdealer'){
        actionText = '*The dealer gets to draw another card...*'
    }
    let gameImageData = await generateBlackjackGame({
        dealerHand: data.dealerHand,
        playerHands: data.playerHands
    })
    data.lastImageData = gameImageData
    msgPayload = {
        content: '',
        embeds: [
            new EmbedBuilder()
            .setColor(3311670)
            .setImage(`attachment://${gameImageData.fileName}`)
            .setDescription(actionText)
        ],
        files: [
            gameImageData.filePath
        ],
        components: [
            new ActionRowBuilder()
            .setComponents(buttons)
        ]
    }

    console.log("PAYLOAD", msgPayload)

    return {
        msgPayload,
        data
    }
}

module.exports = {
    blackjackCreationHandler: async ({interaction, game}) => {
        try {
            let userBalance = await getBalance(interaction.user.id);
            console.log(game.data.meta.rootGame.minBet)
            if(userBalance < game.data.meta.rootGame.minBet){
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(15548997)
                        .setDescription(`❌ The minimum bet for this game is $${game.data.meta.rootGame.minBet}, but you only have a balance of **$${userBalance}**. If you need some extra money, consider using **/freemoney**`)
                        .setFooter({
                            'iconURL': interaction.user.avatarURL() || interaction.user.defaultAvatarURL,
                            'text': interaction.user.globalName || interaction.user.username
                        })
                    ],
                    
                })
            }

            let starterImageData = await generateBlackjackNewgame(userBalance);
            let ret = await queueAction(()=>{
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(3311670)
                        .setImage(`attachment://${starterImageData.fileName}`)
                    ],
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                            .setCustomId(game.customId(['placebet']))
                            .setLabel('Place Bet')
                            .setStyle(ButtonStyle.Primary),
                            
                            new ButtonBuilder()
                            .setCustomId(game.customId(['info']))
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Important Information')
                        )
                    ],
                    files: [
                        starterImageData.filePath
                    ]
                })
            })
        } catch (e) {
            console.error({
                message: 'Blackjack error!',
                error: e,
                interaction: interaction
            })
        }
    },
    blackjackInteractionHandler: async ({interaction, game})=>{
        try {
            if(!interaction.ownershipOverride && interaction.user.id !== game.data.meta.created.user.id){
                return queueAction(()=>{
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(15548997)
                            .setDescription('❌ You are not the owner of this game! Start your own game with the **/play** command')
                        ],
                        ephemeral: true
                    })
                })
            }

            let splt = interaction.customId.split('.');
            let action = splt[2];

            if(action === 'info'){
                return queueAction(()=>{
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(10070709)
                            .setTitle('Important Information about Blackjack')
.setDescription(`
You may want to know a few things about the blackjack game before going ahead and playing it. Knowing these things will keep you from unfairly losing any of your precious fake money.
### Crashes and Bugs
The bot may crash or a game-breaking bug may occur during a game. If this happens, you can let chogi know and they'll figure out what happened and you'll be compensated.
### Inactivity Response
Should you abandon a game (that is, not make a move for more than **5 minutes since your last action**), you will automatically forfeit your bet and lose that game, so don't stall for too long.
`)
                        ],
                        ephemeral: true
                    })
                })
            }

            if(action === 'placebet'){
                await queueAction(()=>{
                    return interaction.showModal(
                        new ModalBuilder()
                        .setTitle("Place Your Bet")
                        .setCustomId(game.customId(['makebet']))
                        .setComponents(
                            new ActionRowBuilder()
                            .addComponents(
                                new TextInputBuilder()
                                .setLabel('Bet')
                                .setRequired(true)
                                .setPlaceholder('1000')
                                .setCustomId('bet')
                                .setStyle(TextInputStyle.Short)
                            )
                        )
                    )
                })

                return;
            }

            if(action === 'newgame'){
                game.data.meta.rootGame.play({
                    creationInteraction: interaction
                })
                return;
            }

            await queueAction(()=>{
                return interaction.deferReply()
            })

            let handled = await handleGame(interaction, game, action)
            let msgPayload = handled.msgPayload;
            let data = handled.data;

            await queueAction(()=>{
                return interaction.deleteReply()
            })

            await queueAction(()=>{
                return interaction.message.edit(msgPayload || 'No data provided')
            })

            game.updateData(data)
        } catch (e) {
            console.error({
                message: 'Blackjack error!',
                error: e,
                interaction: interaction
            })
        }
    }
}

async function inactivityResponses(){
    for(let [gameId, inactiveTime] of Object.entries(inactivityTimes)){
        console.log('CHECKED: ', gameId, inactiveTime, Date.now())
        if(inactiveTime.time > Date.now())continue;
        console.log('INACTIVE: ', gameId)
        delete inactivityTimes[gameId];
        let game = inactiveTime.game;
        await handleGame(
            {
                message: game.data.data.mainMessage
            },
            game,
            'inactivity_response'
        )
    }

    setTimeout(inactivityResponses, 5000);
}

inactivityResponses()