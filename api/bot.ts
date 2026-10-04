import { getWebhookHandler } from '../server/bot/webhook.js'

/**
 * Handler HTTP POST untuk webhook update Telegram.
 * Menggunakan Web Standard Request & Response untuk Vercel Serverless Functions.
 */
export async function POST(req: Request): Promise<Response> {
  // Hanya metode POST yang diizinkan untuk update Telegram
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Verifikasi header X-Telegram-Bot-Api-Secret-Token
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET
  const secretHeader = req.headers.get('x-telegram-bot-api-secret-token')

  if (!expectedSecret || !secretHeader || secretHeader !== expectedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid secret token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const handler = getWebhookHandler(expectedSecret)
    return await handler(req)
  } catch (err: unknown) {
    // Catat error ke log tanpa mencetak token atau rahasia
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error('[Bot Webhook Error]:', errorMessage)

    // Balas 200 OK supaya Telegram tidak mengirim ulang update yang sama berulang-ulang
    return new Response(JSON.stringify({ ok: true, note: 'Error handled' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

/**
 * Handler HTTP GET membalas 405 Method Not Allowed.
 */
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  })
}
