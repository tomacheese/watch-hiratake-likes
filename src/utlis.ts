import fs from 'fs'
import yaml from 'js-yaml'

export interface Config {
  discord: {
    token: string
    channelId: string
    ownerId: string
  }
  twitter: {
    consumerKey: string
    consumerSecret: string
    accessToken: string
    accessSecret: string
  }
}

export function getConfig(): Config {
  const path = process.env.CONFIG_PATH || 'config.yml'
  return yaml.load(fs.readFileSync(path, 'utf8')) as Config
}

export class Notified {
  public static isFirst(): boolean {
    const path = process.env.NOTIFIED_PATH || 'notified-ids.json'
    return !fs.existsSync(path)
  }

  public static isNotified(tweetId: string): boolean {
    const path = process.env.NOTIFIED_PATH || 'notified-ids.json'
    const ids = fs.existsSync(path)
      ? (JSON.parse(fs.readFileSync(path, 'utf8')) as string[])
      : []
    return ids.includes(tweetId)
  }

  public static addNotified(tweetId: string): void {
    const path = process.env.NOTIFIED_PATH || 'notified-ids.json'
    const ids = fs.existsSync(path)
      ? (JSON.parse(fs.readFileSync(path, 'utf8')) as string[])
      : []
    ids.push(tweetId)
    fs.writeFileSync(path, JSON.stringify(ids))
  }
}
