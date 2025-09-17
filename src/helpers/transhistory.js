
const Transaction = require('../models/transaction');
const { queueAction } = require('../services/queue');

async function transactionHistory(userId, page = 1, maxPerPage = 5) {
    return new Promise(async (resolve, reject) => {
        try {
            // Validate input parameters
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            if (page < 1) {
                throw new Error('Page must be 1 or greater');
            }
            
            if (maxPerPage < 1 || maxPerPage > 100) {
                throw new Error('Max per page must be between 1 and 100');
            }

            // Calculate offset for pagination
            const offset = (page - 1) * maxPerPage;

            // Fetch transactions with pagination
            const result = await Transaction.findAndCountAll({
                where: {
                    userId: userId
                },
                order: [
                    ['created', 'DESC']  // Descending order by creation date
                ],
                limit: maxPerPage,
                offset: offset,
                attributes: [
                    'id',
                    'userId', 
                    'amount',
                    'description',
                    'fullDescription',
                    'behalf',
                    'newBalance',
                    'type',
                    'created'
                ]
            });

            // Calculate pagination metadata
            const totalPages = Math.ceil(result.count / maxPerPage);
            const hasNextPage = page < totalPages;
            const hasPreviousPage = page > 1;

            return resolve({
                success: true,
                data: {
                    transactions: result.rows,
                    pagination: {
                        currentPage: page,
                        maxPerPage: maxPerPage,
                        totalTransactions: result.count,
                        totalPages: totalPages,
                        hasNextPage: hasNextPage,
                        hasPreviousPage: hasPreviousPage
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching transaction history:', error);
            return reject({
                success: false,
                error: error.message,
                data: null
            });
        } 
    });
}

function transactionHistoryMessagePayload(history){
    if (!history || !history.transactions || history.transactions.length === 0) {
        return {
            embeds: [
                {
                    title: "Transaction History",
                    description: "No transactions found.",
                    color: 0xffcc00
                }
            ],
            components: []
        };
    }

    const embed = {
        title: "Transaction History",
        color: 0x0099ff,
        description: history.transactions.map(tx => 
            `**ID:** ${tx.id}\n` +
            `**Amount:** ${tx.amount < 0 ? '-' : (tx.amount > 0 ? '+' : '')}$${Math.abs(tx.amount)}\n` +
            `**Type:** ${tx.type}\n` +
            `**Description:** ${tx.description || "N/A"}\n` +
            `**Date:** <t:${Math.floor(new Date(tx.created).getTime() / 1000)}:f>\n`
        ).join('\n'),
        footer: {
            text: `Page ${history.pagination.currentPage} of ${history.pagination.totalPages}`
        }
    };

    const components = [
        {
            type: 1, // Action Row
            components: [
                {
                    type: 2, // Button
                    style: 1, // Primary
                    label: "Previous",
                    custom_id: "transhistory_prev",
                    disabled: !history.pagination.hasPreviousPage
                },
                {
                    type: 2, // Button
                    style: 1, // Primary
                    label: "Next",
                    custom_id: "transhistory_next",
                    disabled: !history.pagination.hasNextPage
                }
            ]
        }
    ];

    return {
        embeds: [embed],
        components: components
    };
}

async function transactionHistoryPrev(interaction) {
    try {
        const userId = interaction.user.id;
        const currentPage = interaction.message?.embeds?.[0]?.footer?.text?.match(/Page (\d+) of (\d+)/);
        let page = currentPage ? parseInt(currentPage[1], 10) : 1;
        page = Math.max(1, page - 1);

        const historyResult = await transactionHistory(userId, page);
        const payload = transactionHistoryMessagePayload(historyResult.data);

        await queueAction(()=>{
            return interaction.update(payload);
        }) 
    } catch (error) {
        await queueAction(()=>{
            return interaction.reply({ content: "Failed to fetch previous page.", ephemeral: true });
        })
    }
}

async function transactionHistoryNext(interaction) {
    try {
        const userId = interaction.user.id;
        const currentPage = interaction.message?.embeds?.[0]?.footer?.text?.match(/Page (\d+) of (\d+)/);
        let page = currentPage ? parseInt(currentPage[1], 10) : 1;
        page = page + 1;

        const historyResult = await transactionHistory(userId, page);
        const payload = transactionHistoryMessagePayload(historyResult.data);

        await queueAction(()=>{
            return interaction.update(payload);
        }) 
    } catch (error) {
        await queueAction(()=>{
            return interaction.reply({ content: "Failed to fetch next page.", ephemeral: true });
        })
    }
}

module.exports = {
    transactionHistory,
    transactionHistoryMessagePayload,
    transactionHistoryPrev,
    transactionHistoryNext
};