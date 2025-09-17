const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const { join } = require("path");
const { cwd } = require("process");
const generateUUID = require("../helpers/uuid");
const calculateDealerHandSum = require("../helpers/dealersum");

const tmpFolder = join(cwd(), 'tmp');
const assetsFolder = join(cwd(), 'assets');
let cardWidth = 85;

const rankValues = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    'T': 10,
    'K': 10,
    'Q': 10,
    'J': 10,
    'A': null
}

async function generateBlackjackNewgame(balance){
    return new Promise(async (resolve, reject) => {
        const canvas = createCanvas(800, 600);
        const ctx = canvas.getContext("2d");

        let bg = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'bjstart.png'))));
        ctx.drawImage(bg, 0, 0);

        balance = String(balance)
        let numX = 115;
        for(let char of balance){
            captionNum = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', `${char}.png`))))
            ctx.drawImage(captionNum, numX, 10);
            numX += 16;
        }

        let imgID = generateUUID();
        let outputFile = join(tmpFolder, `${imgID}.png`)
        const out = fs.createWriteStream(outputFile);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        stream.on('end', ()=>{resolve({
            fileName: `${imgID}.png`,
            filePath: outputFile
        })})
    });
}

async function generateBlackjackGame({
    dealerHand,
    playerHands
}) {
    return new Promise(async (resolve, reject) => {
        try {
            const canvas = createCanvas(800, 600);
            const ctx = canvas.getContext("2d");

            const gradient = ctx.createLinearGradient(0, 0, 0, 600);
            gradient.addColorStop(0, "#358e38ff");
            gradient.addColorStop(1, "#236c28ff");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 600);

            let cardSize = 'large';
            if(playerHands.length == 2){
                cardSize = 'medium';
            }
            if(playerHands.length == 3){
                cardSize = 'small';
            }

            let playerHandRootY;
            let cardSizeData = {
                'large': {
                    cardWidth: 130,
                    startRootY: 365
                },
                'medium': {
                    cardWidth: 90,
                    startRootY: 425
                },
                'small': {
                    cardWidth: 65,
                    startRootY: 455
                }
            }
            async function generateHand(hand, type){
                let rootYUsing = playerHandRootY;
                let cardSizeUsing = cardSize;
                let captionImage;
                let handTotalX;
                let cards = hand.cards;
                
                if(cards.length > 5 && cardSize != 'small'){
                    cardSizeUsing = 'medium'
                }

                if(cards.length > 7 && cardSize != 'small'){
                    cardSizeUsing = 'small'
                }

                if(type == 'dealer'){
                    rootYUsing = 30;
                    captionImage = 'dealershand.png'
                    handTotalX = 188;
                } else if(type == 'firsthand'){
                    if(playerHands.length == 1){
                        captionImage = 'yourhand.png'
                        handTotalX = 155;
                    } else {
                        captionImage = 'yourfirsthand.png'
                        handTotalX = 215;
                    }
                } else if(type == 'secondhand'){
                    captionImage = 'yoursecondhand.png';
                    handTotalX = 248;
                } else if(type == 'thirdhand'){
                    captionImage = 'yourthirdhand.png';
                    handTotalX = 224;
                }

                let cardSizeUsingData = cardSizeData[cardSizeUsing];
                let cardWidthUsing = cardSizeUsingData.cardWidth;
                if(rootYUsing == null){
                    rootYUsing = cardSizeUsingData.startRootY
                }

                captionImage = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', captionImage))));
                ctx.drawImage(captionImage, 20, rootYUsing);

                let handValues = [
                    0,
                    0
                ];

                for(let cardIndex in cards){
                    let card = cards[cardIndex];
                    let cardFileName = join(assetsFolder, 'cards', 'back', 'bicycle_blue.svg');
                    if(card.rank != undefined && card.suit != undefined){
                        cardFileName = join(assetsFolder, 'cards', 'face', `${card.rank}${card.suit}.svg`);
                    }

                    let cardData = await loadImage(Buffer.from(fs.readFileSync(cardFileName)));
                    ctx.drawImage(cardData, (cardIndex * (cardWidthUsing + 10)) + 20, rootYUsing + 30, cardWidthUsing, cardWidthUsing*1.4);

                    let value = rankValues[card.rank] || 0;
                    if(card.rank == 'A'){
                        handValues[0] += 1;
                        handValues[1] += 11;
                    } else {
                        handValues[0] += value;
                        handValues[1] += value;
                    }

                    
                }

                if(type == 'dealer' && cards[1].rank != undefined && handValues[1] >= 17){
                    let dealerSum = calculateDealerHandSum(cards)
                    handValues = [
                        dealerSum,
                        dealerSum
                    ]
                }

                let captionPLeft = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'leftp.png'))))
                ctx.drawImage(captionPLeft, handTotalX, rootYUsing);

                handValues[0] = String(handValues[0]);
                handValues[1] = String(handValues[1]);
                handTotalX += 13;
                console.log(handValues)
                for(let char of handValues[0]){
                    captionNum = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', `${char}.png`))))
                    ctx.drawImage(captionNum, handTotalX, rootYUsing);
                    handTotalX += 16;
                }

                if(handValues[1] != handValues[0] && handValues[1] <= 21){
                    let captionOR = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'or.png'))))
                    ctx.drawImage(captionOR, handTotalX, rootYUsing);
                    handTotalX += 35
                    for(let char of handValues[1]){
                        captionNum = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', `${char}.png`))))
                        ctx.drawImage(captionNum, handTotalX, rootYUsing);
                        handTotalX += 16;
                    }
                }

                if(cards[1].rank === undefined){
                    handTotalX += 5
                    let captionSumUnknown = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'unknownsum.png'))))
                    ctx.drawImage(captionSumUnknown, handTotalX, rootYUsing);
                    handTotalX += 34;
                }

                let captionPRight = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'rightp.png'))))
                ctx.drawImage(captionPRight, handTotalX, rootYUsing);

                if(hand.bet){
                    handTotalX += 20
                    let bet = String(hand.bet);
                    let captionBet = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', 'dollar.png'))))
                    ctx.drawImage(captionBet, handTotalX, rootYUsing);
                    handTotalX += 17
                    for(let char of bet){
                        captionNum = await loadImage(Buffer.from(fs.readFileSync(join(assetsFolder, 'cards', 'generic', `${char}.png`))))
                        ctx.drawImage(captionNum, handTotalX, rootYUsing);
                        handTotalX += 16;
                    }
                }

                if(type != 'dealer'){

                    let cardWidthOrdinary = cardSizeData[cardSize].cardWidth
                    playerHandRootY = rootYUsing - ((cardWidthOrdinary * 1.4) + 50);
                    console.log(playerHandRootY);

                }

            }

            let pHandTypes = [
                'firsthand',
                'secondhand',
                'thirdhand'
            ];

            await generateHand(dealerHand, 'dealer');
            for(let hand in playerHands){
                await generateHand(playerHands[hand], pHandTypes[hand]);
            }

            let imgID = generateUUID();
            let outputFile = join(tmpFolder, `${imgID}.png`)
            console.log(outputFile)
            const out = fs.createWriteStream(outputFile);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            stream.on('end', ()=>{resolve({
                fileName: `${imgID}.png`,
                filePath: outputFile
            })})
        } catch (e) {
            reject(e)
        }
    });
}

module.exports = {
    generateBlackjackNewgame,
    generateBlackjackGame
}