const { Client, Intents, Collection } = require('discord.js');
const { checkEmeraldIdentityDiscord} = require('./flowscripts/emerald_identity.js');
const fs = require('fs');
const schedule = require('node-schedule');

const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/",router);

const axios = require('axios')

const prefix = '!';
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS] });

// Gets all of our commands from our commands folder
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('DayNFT bot is online!');
    
    // Assign/remove roles every 10 minutes
    schedule.scheduleJob("*/10 * * * *", function() {
        const guild = client.guilds.cache.get('939459994611494962');
        client.commands.get('assign_roles').execute(guild);
    }); 
})

// When a user types a message
client.on('messageCreate', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'test') {
        message.channel.send('Testing!');
    } else if (command === 'showcase') {
        client.commands.get('showcase').execute(message, args);
    }
});

router.get('/hooks/test',(req, res) => {
    res.end('blah');
});

router.post('/hooks/bids',(req, res) => {
    console.log(req.body);
    let txId = req.body.flowTransactionId;
    console.log(txId);
    client.commands.get('notifyBidToDiscord').execute(client, txId);
    res.end('');
});

app.listen(3001, async () => {
    console.log("Started on PORT 3001");

    //client.commands.get('notifyBidToDiscord').execute(client, "04f3bb26804b0f4198ed6359ebe580670a5f05fee96f29378d163ef30ec4ed07");
})


// This is the bot's token
// Must be at the bottom of the file
client.login(process.env.TOKEN);
