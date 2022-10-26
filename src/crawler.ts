import {
  ActionRowBuilder,
  AnyThreadChannel,
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  Client,
  TextChannel,
  ThreadChannel,
} from 'discord.js'
import { TwitterApi } from 'twitter-api-v2'
import { Config, Notified, Target } from './utlis'

export default class Crawler {
  private client: TwitterApi
  private channel: TextChannel | AnyThreadChannel
  private target: Target

  constructor(config: Config, client: Client, target: Target) {
    this.client = new TwitterApi({
      appKey: config.twitter.consumerKey,
      appSecret: config.twitter.consumerSecret,
      accessToken: target.accessToken,
      accessSecret: target.accessTokenSecret,
    })
    this.target = target

    const channel = client.channels.resolve(target.channelId)
    if (!channel) {
      throw new Error('Channel not found.')
    }
    if (!channel.isTextBased()) {
      throw new Error('Channel is not text based.')
    }
    this.channel = channel as TextChannel | AnyThreadChannel
  }

  public async crawl(): Promise<void> {
    if (
      this.channel instanceof ThreadChannel &&
      !(this.channel as ThreadChannel).joined
    ) {
      await (this.channel as ThreadChannel).join()
    }

    const favorites = await this.client.v1.favoriteTimeline(
      this.target.twitterId,
      {
        count: 200,
        include_entities: true,
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
        const embeds = []
        const extendedEntities = tweet.extended_entities
        if (!extendedEntities || !extendedEntities.media) {
          continue
        }

        // 同一ツイートのうち、一番最初の画像だけに適用する
        const firstEmbed: APIEmbed = {
          description: tweet.full_text ?? tweet.text,
          fields: [
            {
              name: 'Retweet',
              value: tweet.retweet_count.toString(),
              inline: true,
            },
            {
              name: 'Likes',
              value: tweet.favorite_count.toString(),
              inline: true,
            },
            {
              name: 'TweetURL',
              value: tweetUrl,
              inline: false,
            },
          ],
          author: {
            name: `${tweet.user.name} (@${tweet.user.screen_name})`,
            url: `https://twitter.com/${tweet.user.screen_name}`,
            icon_url: tweet.user.profile_image_url_https,
          },
        }
        // 同一ツイートのうち、一番最後の画像だけに適用する
        // 単一画像の場合は、一番最初の画像に適用する
        const lastEmbed: APIEmbed = {
          footer: {
            text: `Twitter by ${this.target.name} likes`,
          },
          timestamp: new Date(tweet.created_at).toISOString(),
        }

        for (const mediaIndex in extendedEntities.media) {
          const media = extendedEntities.media[mediaIndex]
          const title =
            extendedEntities.media.length >= 2
              ? `${parseInt(mediaIndex, 10) + 1} / ${
                  extendedEntities.media.length
                }`
              : undefined
          embeds.push({
            title,
            image: {
              url: media.media_url_https,
            },
            color: 0x1d9bf0,
            ...(parseInt(mediaIndex, 10) === 0 ? firstEmbed : {}),
            ...(parseInt(mediaIndex, 10) === extendedEntities.media.length - 1
              ? lastEmbed
              : {}),
          })
        }

        await this.channel.send({
          embeds,
          components: [row],
        })
      }
      Notified.addNotified(this.target.twitterId, tweet.id_str)
    }
  }
}
