const fcl = require("@onflow/fcl");
const t = require("@onflow/types");
const { setEnvironment } = require("flow-cadut");

const queryDayNFT = async (address, date) => {
  await setEnvironment("mainnet");
  const url = await fcl.send([
    fcl.script(`
      import DayNFT from 0x1600b04bf033fb99

      pub fun main(address: Address, date: String): [String?] {
        let collectionRef = getAccount(address)
          .getCapability(DayNFT.CollectionPublicPath)
          .borrow<&DayNFT.Collection{DayNFT.CollectionPublic}>()
          ?? panic("Could not get reference to the NFT Collection")
        
        var res_url: String? = nil
        var res_id: String? = nil
        let ids = collectionRef.getIDs()
        for id in ids {
          let nft = collectionRef.borrowDayNFT(id: id)!
          if (nft!.dateStr == date) {
            res_url = nft!.thumbnail
            res_id = id.toString()
          }
        }
        return [res_url, res_id]
      }
    `),
    fcl.args([
      fcl.arg(address, t.Address),
      fcl.arg(date, t.String),
    ])
  ]).then(fcl.decode);

  return url
}

module.exports = {
  queryDayNFT
}
