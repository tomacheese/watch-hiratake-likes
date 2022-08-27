import fs from 'fs'
import yaml from 'js-yaml'

export interface Target {
  twitterId: string
  channelId: string
}

export interface Config {
  discord: {
    token: string
    ownerId: string
  }
  targets: Target[]
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
  public static isFirst(targetId: string): boolean {
    const path = process.env.NOTIFIED_PATH || 'notified.json'
    return (
      !fs.existsSync(path) ||
      !(targetId in JSON.parse(fs.readFileSync(path, 'utf8')))
    )
  }

  public static isNotified(targetId: string, tweetId: string): boolean {
    const path = process.env.NOTIFIED_PATH || 'notified.json'
    const json = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : {}
    return targetId in json && json[targetId].includes(tweetId)
  }

  public static addNotified(targetId: string, tweetId: string): void {
    const path = process.env.NOTIFIED_PATH || 'notified.json'
    const json = fs.existsSync(path)
      ? JSON.parse(fs.readFileSync(path, 'utf8'))
      : {}
    json[targetId] = json[targetId] || []
    json[targetId].push(tweetId)
    fs.writeFileSync(path, JSON.stringify(json))
  }
}
