import json
import os


def get_key(key: str, default_value=None):
    json_path = "/data/config.json"
    if os.environ.get("CONFIG_PATH"):
        json_path = os.environ["CONFIG_PATH"]

    with open(json_path, "r") as f:
        config = json.load(f)
    if default_value is None and key not in config:
        print("{} is not defined.".format(key))
        exit(1)
    if key not in config and default_value is not None:
        return default_value
    return config[key]


DISCORD_TOKEN = get_key("DISCORD_TOKEN")
DISCORD_CHANNEL_ID = get_key("DISCORD_CHANNEL_ID")
TWITTER_CONSUMER_KEY = get_key("TWITTER_CONSUMER_KEY")
TWITTER_CONSUMER_SECRET = get_key("TWITTER_CONSUMER_SECRET")
TWITTER_ACCESS_TOKEN = get_key("TWITTER_ACCESS_TOKEN")
TWITTER_ACCESS_TOKEN_SECRET = get_key("TWITTER_ACCESS_TOKEN_SECRET")
