const fcl = require("@onflow/fcl");

fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org"
})

const checkEmeraldIdentityDiscord = async (discordID) => {
    const accountResponse = await fcl.query({
      cadence: `
          import EmeraldIdentity from 0x39e42c67cc851cfb

          pub fun main(discordID: String): Address? {
            return EmeraldIdentity.getAccountFromDiscord(discordID: discordID)
          }
      `,
      args: (arg, t) => [
        arg(discordID, t.String)
      ],
    });

    return accountResponse;
}

module.exports = {
    checkEmeraldIdentityDiscord
}
