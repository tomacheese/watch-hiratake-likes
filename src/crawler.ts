import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  TextChannel
} from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import { Config, Notified, Target } from './utlis'

export default class Crawler {
  private client: TwitterApi
  private channel: TextChannel
  private target: Target

  constructor(config: Config, client: Client, target: Target) {
    this.client = new TwitterApi({
      appKey: config.twitter.consumerKey,
      appSecret: config.twitter.consumerSecret,
      accessToken: target.accessToken,
      accessSecret: target.accessTokenSecret
    })
    this.target = target

    const channel = client.channels.resolve(target.channelId)
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel
  }

  public async crawl(): Promise<void> {
    const favorites = await this.client.v1.favoriteTimeline(
      this.target.twitterId,
      {
        count: 200
      }
    )
    const tweets = favorites.tweets

    const isFirst = Notified.isFirst(this.target.twitterId)

    for (const tweet of tweets) {
      if (!tweet.entities.media) {
        continue
      }
      if (Notified.isNotified(this.target.twitterId, tweet.id_str)) {
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
          .setEmoji('❤')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('priv-fav-' + tweet.id_str)
          .setEmoji('☄️')
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
          embeds: [
            {
              author: {
                name: `${tweet.user.name} (@${tweet.user.screen_name})`,
                url: `https://twitter.com/${tweet.user.screen_name}`,
                icon_url: tweet.user.profile_image_url_https
              },
              description: tweet.full_text ?? tweet.text,
              url: tweetUrl,
              color: 0x1d9bf0,
              fields: [
                {
                  name: 'Retweet',
                  value: tweet.retweet_count.toString(),
                  inline: true
                },
                {
                  name: 'Likes',
                  value: tweet.favorite_count.toString(),
                  inline: true
                }
              ],
              image: {
                url: tweet.entities.media[0].media_url_https
              },
              footer: {
                text: `Twitter by ${this.target.name} likes`
              },
              timestamp: new Date(tweet.created_at).toISOString()
            }
          ],
          components: [row]
        })
      }
      Notified.addNotified(this.target.twitterId, tweet.id_str)
    }
  }
}
