import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  TextChannel,
} from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import { Config, Notified } from './utlis'

export default class Crawler {
  private client: TwitterApi
  private channel: TextChannel

  constructor(config: Config, client: Client) {
    this.client = new TwitterApi({
      appKey: config.twitter.consumerKey,
      appSecret: config.twitter.consumerSecret,
    })
    const channel = client.channels.resolve(config.discord.channelId)
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel
  }

  public async crawl(targetId: string): Promise<void> {
    const favorites = await this.client.v1.favoriteTimeline(targetId, {
      count: 200,
    })
    const tweets = favorites.tweets

    const isFirst = Notified.isFirst()

    for (const tweet of tweets) {
      if (!tweet.entities.media) {
        continue
      }
      if (Notified.isNotified(tweet.id_str)) {
        continue
      }

      const tweetUrl =
        'https://twitter.com/' +
        tweet.user.screen_name +
        '/status/' +
        tweet.id_str

      console.log(tweetUrl)

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('favorite-' + tweet.id_str)
          .setEmoji('❤️')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setEmoji('🔁')
          .setURL(`https://twitter.com/intent/retweet?tweet_id=${tweet.id_str}`)
          .setStyle(ButtonStyle.Link),
        new ButtonBuilder()
          .setEmoji('❤️')
          .setURL(`https://twitter.com/intent/like?tweet_id=${tweet.id_str}`)
          .setStyle(ButtonStyle.Link)
      )

      if (!isFirst) {
        await this.channel.send({
          content: tweetUrl,
          components: [row],
        })
      }
      Notified.addNotified(tweet.id_str)
    }
  }
}
