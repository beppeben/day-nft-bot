const { checkEmeraldIdentityDiscord } = require('../flowscripts/emerald_identity.js');
const { MessageEmbed } = require('discord.js');
const { queryDayNFTUrl } = require('../flowscripts/query_daynft_url.js');

const execute = async (message, args) => {
    console.log("Showcasing NFT");
    if (args.length === 1) {
        let account = await checkEmeraldIdentityDiscord(message.member.id);
        if (account) {
            console.log("Returned account from ecid", account);
            let date = args[0];
            let url = await queryDayNFTUrl(account, date);
            console.log("Returned url", url);
            if (url != null) {
                const exampleEmbed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(message.member.user.username + " holds this amazing DayNFT")
                    .setImage(url)
                message.channel.send({ embeds: [exampleEmbed] });
            } else {
                message.reply({ ephemeral: true, content: "You don't hold this NFT, please check the date and try again!"});
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

