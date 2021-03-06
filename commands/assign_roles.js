const { checkEmeraldIdentityDiscord } = require('../flowscripts/emerald_identity.js');
const { MessageEmbed } = require('discord.js');
const { getIDs } = require('../flowscripts/get_ids.js');

const role_duke = '957352202987524166';
const role_prince = '957352800034115594';
const role_king = '956329106809704498';
const role_queen = '996160808239235072';
const roles = [role_duke, role_prince, role_king, role_queen];

const execute = async (guild) => {   
    guild.members.fetch().then(async members =>
    {
        console.log("assigning roles");
        for (const [key, member] of members) {
            let account = await checkEmeraldIdentityDiscord(member.user.id);
            if (account) {
                try {
                    let ids = await getIDs(account);
                    let num_nfts = ids.length;
                    if(num_nfts > 0) {
                        var role_to_give = role_duke;
                        if(num_nfts > 9) {
                            role_to_give = role_queen;
                        }
                        else if(num_nfts > 4) {
                            role_to_give = role_king;
                        } else if(num_nfts > 2) {
                            role_to_give = role_prince;
                        }
                        for (const role of roles) {
                            if(role != role_to_give) {
                                member.roles.remove(role).catch((e) => console.log(e));
                            }                        
                        }
                        member.roles.add(role_to_give).catch((e) => console.log(e));                
                    }                   
                } catch(error){};
            }
        }
        console.log("roles assigned");
    }).catch(console.log);
    
}


module.exports = {
    name: 'assign_roles',
    description: 'Assign roles to the community',
    execute: execute
}

