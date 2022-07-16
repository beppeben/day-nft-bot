const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const fs = require('fs');
const { OpenSeaStreamClient } = require('@opensea/stream-js');
const { WebSocket } = require('ws');
const schedule = require('node-schedule');

/*
const os_client = new OpenSeaStreamClient({
    token: process.env.OPENSEA_KEY,
    connectOptions: {
        transport: WebSocket
    },
    onError: async (error) => {
        console.log("catching error")
        console.log(error);
        await new Promise(r => setTimeout(r, 2000));
        os_client.connect();
    }
});
*/

var storedAllAssets = {};
var storedAllTraits = {};
var downloading = false;
var lastListing = null

axiosRetry(axios, {
    retries: 10, // number of retries
    retryDelay: (retryCount) => {
      console.log(`retry attempt: ${retryCount}`);
      return retryCount * 2000; // time interval between retries
    },
    retryCondition: (error) => {
      console.log(error.response.status);
      return true;
    },
});


const execute = async (disc_client) => {
    // try to get collection info from disk
    fs.readFile('collection_info.json', (err, data) => {
        if (err) {
            processCollection();
        } else {
            console.log("Collection retrieved from disk")
            const collection_info = JSON.parse(data);
            storedAllAssets = collection_info.assets
            storedAllTraits = collection_info.traits
        }  
    });

    // refresh every 6 hours
    schedule.scheduleJob("0 */6 * * *", function() {
        if (!downloading) {
            processCollection();
        }       
    });


    // refresh every minute
    processListings(disc_client);
    schedule.scheduleJob("*/1 * * * *", function() {
        processListings(disc_client);      
    }); 
}

async function processListings(disc_client) {
    const res = await axios.get("https://api.opensea.io/api/v1/events?only_opensea=false&collection_slug=pirates-of-the-metaverse-by-drip-studios&event_type=created", {
         headers: {
           "X-API-KEY": process.env.OPENSEA_KEY
         }
    });
    if (lastListing == null) {
        lastListing = res.data.asset_events[0].asset.name
        return
    }

    for (var i = 0; i < res.data.asset_events.length; i++) {
        const event = res.data.asset_events[i]
        if (event.asset.name == lastListing) {
            break;
        }
        console.log("New listing: " + event.asset.name)
        const notification = searchRemarkableTraits(event)
        notifyDiscord(disc_client, notification)
    }

    lastListing = res.data.asset_events[0].asset.name
}

function notifyDiscord(disc_client, notification) {
    const channel = disc_client.channels.cache.get('977332356585242695');
    const price = notification.price / (10**18)

    const alertEmbed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Listing alert")
        .setDescription("POTM #" + notification.id)
        .setThumbnail(notification.thumbnail)
        .setURL(notification.url)
        .addField('Price', price.toString() + " ETH")

    notification.remarkable_traits.forEach(trait => {
        const num_listed = trait.num_listed + 1
        const trait_desc = trait.trait_type + ": " + trait.value + " (" + trait.trait_count.toString() + " total, " + num_listed.toString() + " listed)"
        var price_desc = "Only one listed"
        if (trait.floor != null) {
            const perc = Math.round((1 - notification.price / trait.floor) * 1000) / 10
            price_desc = perc.toString() + "% below trait floor price"
        }
        alertEmbed.addField(trait_desc, price_desc)
    })
    
    if (notification.remarkable_traits.length > 0 && !notification.is_private && (notification.auction_type == "dutch" || notification.auction_type == null)) {
        channel.send({ embeds: [alertEmbed] });
    }   
}

function searchRemarkableTraits(event) {
    const url = event.asset.permalink;
    const id = url.substring(url.lastIndexOf('/') + 1);
    const price = Number(event.starting_price);
    var remarkable_traits = [];
    if (id in storedAllAssets) {
        const asset = storedAllAssets[id];
        asset.traits.forEach(trait => {
            const trait_key = trait.trait_type + trait.value;
            const trait_count = trait.trait_count;
            const trait_stats = storedAllTraits[trait_key];
            const floor = trait_stats.floor;
            const num_listed = trait_stats.num_listed;         
            if (trait_count < 1000 && (num_listed == 0 || price < floor) ) {
                var remarkable_trait = new Object();
                remarkable_trait.trait_type = trait.trait_type;
                remarkable_trait.value = trait.value;
                remarkable_trait.trait_count = trait_count;
                remarkable_trait.floor = floor;
                remarkable_trait.num_listed = num_listed;
                remarkable_traits.push(remarkable_trait);                  
            }
        })
    }
    
    var notification = new Object();
    notification.id = id;
    notification.url = url;
    notification.price = price;
    notification.thumbnail = event.asset.image_thumbnail_url;
    notification.auction_type = event.auction_type;
    notification.is_private = event.is_private
    notification.remarkable_traits = remarkable_traits;
    if (remarkable_traits.length > 0) {         
        console.log(notification);
    }
    return notification
}

async function processCollection() {
    downloading = true
    console.log("Downloading collection")
    var allAssets = {};
    var allTraits = {};
    
    for (let i = 1; i <= 10000; i++) {
        const id = i.toString();
        const res = await axios.get("https://api.opensea.io/api/v1/asset/0xe75113d4a417c2d33c67fb127b419e5f47c5d62c/" + id + "/?include_orders=true", {
             headers: {
               "X-API-KEY": process.env.OPENSEA_KEY
             }
        });

        var asset = new Object();

        asset.price = null
        if(res.data.orders != null && res.data.orders.length > 0) {
            res.data.orders.forEach(order => {
                if (order.side == 1 && order.sale_kind == 0 && order.payment_token_contract.symbol == "ETH" && order.taker.address == "0x0000000000000000000000000000000000000000") {
                    if (asset.price == null) {
                        asset.price = Number(order.current_price)
                    } else {
                        asset.price = Math.min(asset.price, Number(order.current_price))
                    }
                }
            })
        }
        
        asset.traits = []
        res.data.traits.forEach(element => {
            const trait_desc = {trait_type: element.trait_type, value: element.value, trait_count: element.trait_count};
            asset.traits.push(trait_desc);
            const trait_key = element.trait_type + element.value;
            if(allTraits[trait_key] == undefined) {
                var trait = {};
                trait.floor = asset.price;
                trait.num_listed = asset.price == null ? 0 : 1;
                allTraits[trait_key] = trait;
            } else if (asset.price != null) {
                const curr_floor = allTraits[trait_key].floor      
                allTraits[trait_key].floor = curr_floor == null ? asset.price : Math.min(curr_floor, asset.price)
                allTraits[trait_key].num_listed = allTraits[trait_key].num_listed + 1
            }
        });
         
        allAssets[id] = asset;
        if (i % 100 == 0) {
            console.log("Done: " + id);
        }
        // wait a little bit before next request
        await new Promise(r => setTimeout(r, 50));
    }

    storedAllAssets = allAssets;
    storedAllTraits = allTraits;
    
    const collection_info = {assets: allAssets, traits: allTraits}
    fs.writeFile('collection_info.json', JSON.stringify(collection_info), (err) => {  
        if (err) throw err;
        console.log('Collection saved!');
    });

    downloading = false
}


module.exports = {
    name: 'pirate_sniper',
    description: 'Launch Pirate Sniper',
    execute: execute
}

