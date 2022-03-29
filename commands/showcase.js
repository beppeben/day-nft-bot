const { checkEmeraldIdentityDiscord } = require('../flowscripts/emerald_identity.js');
const { MessageEmbed } = require('discord.js');
const { queryDayNFT } = require('../flowscripts/query_daynft.js');

const execute = async (message, args) => {
    if (args.length === 1) {
        let account = await checkEmeraldIdentityDiscord(message.member.id);
        if (account) {
            let date = args[0];
            try{
                let [url, id] = await queryDayNFT(account, date);
                if (url != null) {
                    const exampleEmbed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle(message.member.user.username + " holds this amazing DayNFT")
                        .setDescription('ID #' + id)
                        .setImage(url)
                    message.channel.send({ embeds: [exampleEmbed] });
                } else {
                    message.reply({ ephemeral: true, content: "You don't hold this NFT, please check the date and try again!"});
                }  
            } catch(error) {
                message.reply({ ephemeral: true, content: "No DayNFT found in this collection"});
            }
            
        } else {
            message.reply({ ephemeral: true, content: 'You need an EmeraldID to authenticate your holdings. Please go to <#908380374223179778> to get one!'});
        }
    } else {
        message.channel.send("Please use showcase with one argument, the date of the DayNFT");
    }     
}


module.exports = {
    name: 'showcase',
    description: 'showcase an NFT',
    execute: execute
}

