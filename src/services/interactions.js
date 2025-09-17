const fs = require("fs");
const { join } = require("path");
const { cwd } = require("process");
const getGuild = require("../helpers/getguild");
const { debugGuildId } = require("../configs/general");
const lastCMDState = require("../helpers/lastcmdstate");
const CMDState = require("../models/cmdstate");
const stringToHex = require("../helpers/strtohex");
const affirmUser = require("../helpers/affirmuser");
const { Game, ActiveGame } = require("./games");
const { transactionHistoryNext, transactionHistoryPrev } = require("../helpers/transhistory");
let compiledCommands = {};
let forcePOST = false;

function loadCommands(client){
    return new Promise(async (resolve, reject) => {
        try {
            let commandState = "";
            let commandList = [];
            let commandModules = fs.readdirSync(join(cwd(), "src", "commands"));
            commandModules.forEach(commandModule=>{
                commandModule = require(join(cwd(), "src", "commands", commandModule));

                compiledCommands[commandModule.name] = commandModule;
                commandList.push(commandModule.data);

                let commandDataHash = stringToHex(JSON.stringify(commandModule.data.toJSON()));
                commandState = `${commandState == '' ? '' : `${commandState}.`}${commandDataHash}`
            });
            console.log("Compiled commands: ", compiledCommands)
            
            let recentCommandState = await lastCMDState();
            if(recentCommandState?.dataValues.state !== commandState || forcePOST){
                await client.application.commands.set(commandList)
                
                let debugGuild = await getGuild(client, debugGuildId)
                await debugGuild.commands.set([]);
                //debugGuild.commands.set(commandList)

                await CMDState.create({
                    state: commandState
                })
            } else {
                console.log("Command state already exists, skipping POST")
            }

            resolve(true)
        } catch (e) {
            reject(e)
        }
    });
}

async function handleInteraction(client, interaction){
    await affirmUser(interaction.user.id)

    switch (interaction.type) {
        case 2: // Command
            compiledCommands[interaction.commandName].execute(client, interaction)
            break;
    
        default:
            let customId = interaction.customId;
            if(customId){
                if(customId === 'transhistory_prev'){
                    return transactionHistoryPrev(interaction)
                }

                if(customId === 'transhistory_next'){
                    return transactionHistoryNext(interaction)
                }

                let splt = customId.split('.');
                if(splt.length > 1 && splt[0] == 'game'){
                    ActiveGame.handleInteraction(interaction)
                }
            }
            break;
    }
}

module.exports = {
    loadCommands,
    handleInteraction
}