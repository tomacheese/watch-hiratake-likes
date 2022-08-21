import datetime
import json
import logging
import os
from logging.handlers import TimedRotatingFileHandler

import requests


def load_notified_ids() -> list:
    json_path = "/data/notified_ids.json"
    if os.environ.get("IDS_PATH"):
        json_path = os.environ["IDS_PATH"]

    notified_ids = []
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            notified_ids = json.load(f)
    return notified_ids


def add_notified_id(notified_id):
    notified_ids = load_notified_ids()
    notified_ids.append(notified_id)
    save_notified_ids(notified_ids)


def save_notified_ids(notified_ids: list):
    json_path = "/data/notified_ids.json"
    if os.environ.get("IDS_PATH"):
        json_path = os.environ["IDS_PATH"]

    with open(json_path, "w") as f:
        f.write(json.dumps(notified_ids))


def send_discord_message(token: str,
                         channel_id: str,
                         message: str = "",
                         embed: dict = None):
    print("sendDiscordMessage: {message}".format(message=message))
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bot {token}".format(token=token),
        "User-Agent": "Bot"
    }
    params = {
        "content": message,
        "embed": embed
    }
    response = requests.post(
        "https://discord.com/api/channels/{channelId}/messages".format(channelId=channel_id), headers=headers,
        json=params)
    print("response: {code}".format(code=response.status_code))
    print("response: {message}".format(message=response.text))
