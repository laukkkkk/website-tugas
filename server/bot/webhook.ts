import { webhookCallback } from 'grammy'
import { getBot } from './bot.js'

let webhookHandler: ((req: Request) => Promise<Response>) | null = null

/**
 * Mereset instance webhookHandler (berguna untuk isolasi testing).
 */
export function resetBotWebhookHandler(): void {
  webhookHandler = null
}

/**
 * Mengambil instance webhookCallback grammY dengan adapter 'std/http'.
 */
export function getWebhookHandler(secretToken?: string): (req: Request) => Promise<Response> {
  if (!webhookHandler) {
    const bot = getBot()
    webhookHandler = webhookCallback(bot, 'std/http', {
      onTimeout: 'return',
      timeoutMilliseconds: 10_000,
      secretToken,
    })
  }
  return webhookHandler
}
