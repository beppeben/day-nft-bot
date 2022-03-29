const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const { setEnvironment } = require("flow-cadut");

const getIDs = async (address) => {
  await setEnvironment("mainnet");
  const ids = await fcl.send([
    fcl.script(`
      import DayNFT from 0x1600b04bf033fb99

      pub fun main(address: Address): [UInt64] {
        let collectionRef = getAccount(address)
          .getCapability(DayNFT.CollectionPublicPath)
          .borrow<&DayNFT.Collection{DayNFT.CollectionPublic}>()
          ?? panic("Could not get reference to the NFT Collection")
        
        return collectionRef.getIDs()
      }
    `),
    fcl.args([
      fcl.arg(address, t.Address),
    ])
  ]).then(fcl.decode);

  return ids
}

module.exports = {
  getIDs
}
