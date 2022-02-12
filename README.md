Source code for the DayNFT discord bot.

The bot is triggered by any user typing "!showcase __date__", for example:

!showcase 10-02-2022

The bot first retrieves the user's wallet address by EmeraldID, then checks whether she holds the NFT corresponding to the requested date (there exists a unique DayNFT per date). If that is the case, the bot replies by showing the NFT image.
