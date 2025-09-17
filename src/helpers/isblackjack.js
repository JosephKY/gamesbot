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

function isBlackjack(hand) {
    console.log("HAND", hand)
    const ranks = hand.map(card => card.rank);
    const hasAce = ranks.includes('A');
    const hasTenValue = ranks.some(rank => ['T', 'J', 'Q', 'K'].includes(rank));
    if(hasAce && hasTenValue && hand.length === 2){
        return true;
    }

    if(!hasAce){
        let classicValue = 0;
        hand.forEach(card=>{
            classicValue += classicalValues[card.rank];
        })
        return classicValue == 21;
    }

    return false;
};

module.exports = isBlackjack