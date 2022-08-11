const { MessageEmbed } = require('discord.js');
const fcl = require("@onflow/fcl");
const axios = require('axios');
const p5 = require('node-p5');
var fs = require('fs');

fcl.config({
  "accessNode.api": "https://rest-mainnet.onflow.org"
})

var dateToMaxBid = new Object();

const Twit = require("twit");
const T = new Twit({
  consumer_key: process.env.TWITTER_API_KEY,
  consumer_secret: process.env.TWITTER_API_SECRET,
  access_token: process.env.TWITTER_TOKEN,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET,
});

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
    let date = Number(rawDate[0].value).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + "-" + Number(rawDate[1].value).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + "-" + rawDate[2].value;

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

    // send to Discord
    const channel = client.channels.cache.get('961715085661831258');
    const bidEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setAuthor(author)
        .addField('Date', date, true)
        .addField('Amount', "" + amount + " FLOW", true)
        .setDescription(message)
    channel.send({ embeds: [bidEmbed] });
    
    // create image and post a tweet
    console.log("current max bid: " + dateToMaxBid[date])
    console.log("new amount: " + amount)
    if(dateToMaxBid[date] == undefined || amount > dateToMaxBid[date]) {
        var sketch_path = process.env.DAYNFT_PUBLIC
        var out_path = process.env.DAYNFT_IMG_TEMP + "img"
        eval(fs.readFileSync(sketch_path + 'sketch.js')+'');
        p5.createSketch(sketchWithParams(date, message, 600, sketch_path, out_path));
        setTimeout(function() {
            var filePath = out_path + ".png"
            T.postMediaChunked({ file_path: filePath }, function (err, data, response) {
                console.log(data)
                if (err) {
                    console.log("Error: ", err.message);
                    return;
                }
                const text = "New bid by " + author + " for " + amount + " FLOW!";
                const onFinish = (err, reply) => {
                    if (err) {
                      console.log("Error: ", err.message);
                    }
                };
                T.post("statuses/update", { status: text, media_ids: data.media_id_string }, onFinish);
            })
        }, 3000);
        dateToMaxBid[date] = amount;
    }
}


module.exports = {
    name: 'notifyBidToDiscord',
    description: 'Notify a received bid to discord channel',
    execute: execute
}

