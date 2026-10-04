import type { VercelRequest, VercelResponse } from '@vercel/node'
import { webhookCallback } from 'grammy'
import { getBot } from '../server/bot/bot.js'

let webhookHandler: ((req: any, res: any) => Promise<any>) | null = null

/**
 * Endpoint webhook Telegram untuk Vercel Serverless Function.
 * Menerima update dari Telegram Bot API dan memverifikasi secret token.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya metode POST yang diizinkan untuk update Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Verifikasi header X-Telegram-Bot-Api-Secret-Token
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const secretHeader = req.headers['x-telegram-bot-api-secret-token']

  if (!expectedSecret || secretHeader !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized: invalid secret token' })
  }

  // Inisialisasi webhookCallback grammY (lazy singleton)
  if (!webhookHandler) {
    const bot = getBot()
    webhookHandler = webhookCallback(bot, 'express', {
      onTimeout: 'return',
      timeoutMilliseconds: 10_000,
      secretToken: expectedSecret,
    }) as any
  }

  return webhookHandler!(req, res)
}
