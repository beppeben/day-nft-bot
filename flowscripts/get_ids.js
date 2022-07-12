const fcl = require("@onflow/fcl");

fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org"
})

const getIDs = async (address) => {
  const ids = await fcl.query({
      cadence: `
          import DayNFT from 0x1600b04bf033fb99

          pub fun main(address: Address): [UInt64] {
            let collectionRef = getAccount(address)
              .getCapability(DayNFT.CollectionPublicPath)
              .borrow<&DayNFT.Collection{DayNFT.CollectionPublic}>()
              ?? panic("Could not get reference to the NFT Collection")
            
            return collectionRef.getIDs()
          }
      `,
      args: (arg, t) => [
        arg(address, t.Address)
      ]
    });
  return ids
}

module.exports = {
  getIDs
}
