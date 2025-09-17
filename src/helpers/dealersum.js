function calculateDealerHandSum(cards) {
    let sum = 0;
    let aceCount = 0;

    for (const card of cards) {
        const rank = card.rank;
        if (rank === 'A') {
            aceCount += 1;
            sum += 11;
        } else if (['T', 'J', 'Q', 'K'].includes(rank)) {
            sum += 10;
        } else {
            sum += parseInt(rank, 10);
        }
    }

    // Adjust for aces if sum is over 21
    while (sum > 21 && aceCount > 0) {
        sum -= 10;
        aceCount -= 1;
    }

    return sum;
}

module.exports = calculateDealerHandSum;