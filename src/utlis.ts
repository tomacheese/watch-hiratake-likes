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
  return yaml.load(fs.readFileSync('./config.yml', 'utf8')) as Config
}
