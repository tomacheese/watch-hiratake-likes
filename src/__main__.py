from pprint import pprint

import tweepy
from tweepy.cursor import ItemIterator

from src import add_notified_id, config, load_notified_ids, send_discord_message


def get_tweets(ck: str,
               cs: str,
               at: str,
               ats: str) -> ItemIterator:
    auth = tweepy.OAuthHandler(ck, cs)
    auth.set_access_token(at, ats)
    api = tweepy.API(auth)

    # return tweepy.Cursor(api.get_favorites, user_id=543927796, count=200, include_entities=True).items(200)

    return api.get_favorites(user_id=543927796, count=200, include_entities=True)


def main():
    notified_ids = load_notified_ids()
    is_first = len(notified_ids) == 0

    tweets = get_tweets(config.TWITTER_CONSUMER_KEY,
                        config.TWITTER_CONSUMER_SECRET,
                        config.TWITTER_ACCESS_TOKEN,
                        config.TWITTER_ACCESS_TOKEN_SECRET)

    for tweet in tweets:
        tweet_id = tweet.id_str
        screen_name = tweet.user.screen_name
        media = tweet.entities.get("media", [])
        if len(media) == 0:
            continue

        url = "https://twitter.com/{}/status/{}".format(screen_name, tweet_id)
        if tweet_id in notified_ids:
            continue

        pprint(tweet)

        if not is_first:
            send_discord_message(config.DISCORD_TOKEN, config.DISCORD_CHANNEL_ID, url)

        add_notified_id(tweet_id)


if __name__ == "__main__":
    main()
