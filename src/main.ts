import { Client } from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import Crawler from './crawler'
import { getConfig } from './utlis'

const config = getConfig()
const client = new Client({
  intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
})
const twitterClient = new TwitterApi({
  appKey: config.twitter.consumerKey,
  appSecret: config.twitter.consumerSecret,
  accessToken: config.twitter.accessToken,
  accessSecret: config.twitter.accessSecret,
})

export function getClient() {
  return client
}

client.on('ready', async () => {
  console.log(`ready: ${client.user?.tag}`)

  const crawler = new Crawler(config, client)
  setInterval(async () => {
    await crawler.crawl('543927796')
  }, 1000 * 60 * 10)
  await crawler.crawl('543927796')
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return
  if (interaction.customId.startsWith('favorite-')) {
    if (interaction.user.id !== config.discord.ownerId) {
      await interaction.reply({
        content:
          'このボタンはbook000でふぁぼする用のボタンです。リンクボタンを利用してください。',
        ephemeral: true,
      })
      return
    }
    const tweetId = interaction.customId.split('-')[1]
    await twitterClient.v1
      .post(`favorites/create.json`, {
        id: tweetId,
      })
      .then(() => {
        interaction.reply({
          content: ':white_check_mark:',
          ephemeral: true,
        })
      })
      .catch((e) => {
        interaction.reply({
          content: e.message,
          ephemeral: true,
        })
      })
  }
})

client.login(config.discord.token).then(() => console.log('Login Successful.'))
