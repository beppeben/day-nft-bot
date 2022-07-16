const { MessageEmbed } = require('discord.js');
const fcl = require("@onflow/fcl");
const axios = require('axios');
const p5 = require('node-p5');
var fs = require('fs');

fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org"
})

const execute = async (client, txId) => {
    fcl
      .send([
        fcl.getTransaction(txId),
      ])
      .then(fcl.decode)
      .then((tx) => {processTxAndSendText(client, tx)})
      .catch(error => {
        console.log(error);
      });
}

function processTxAndSendText(client, tx) {
    let amount = Number(tx.args[0].value);
    let message = tx.args[1].value;
    let address = "0x" + tx.authorizers[0];
    let rawDate = tx.args[2].value;
    let date = rawDate[0].value + "/" + rawDate[1].value + "/" + rawDate[2].value;

    axios
      .get("https://lookup.find.xyz/api/lookup?address=" + address)
      .then(res => {
        if(res.status == 200){
            var author = ""
            if(res.data == "nil"){
                author = address
            }else {
                author = res.data + ".find"
            }
            sendBidText(client, author, date, amount, message);
        }
      })
      .catch(error => {
        sendBidText(client, address, date, amount, message);
      })  
}

function sendBidText(client, author, date, amount, message) {
    text = author + " has made a bid on date " + date + " for " + amount + " FLOW with message '" + message + "'";
    const channel = client.channels.cache.get('961715085661831258');

    const bidEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setAuthor(author)
        .addField('Date', date, true)
        .addField('Amount', "" + amount + " FLOW", true)
        .setDescription(message)
    channel.send({ embeds: [bidEmbed] });

    
    var sketch_path = "/home/giuseppe/day-nft/day-nft-app/public/"
    var out_path = "/var/www/day-nft/imgs-temp/" + date
    eval(fs.readFileSync(sketch_path + 'sketch.js')+'');
    p5.createSketch(sketchWithParams(date, message, 600, sketch_path, out_path));
    setTimeout(function() {
        //process.exit();
    }, 3000);
}


module.exports = {
    name: 'notifyBidToDiscord',
    description: 'Notify a received bid to discord channel',
    execute: execute
}

