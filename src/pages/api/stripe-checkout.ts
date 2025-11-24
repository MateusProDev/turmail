import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2023-10-16' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    console.warn(`stripe-checkout: method ${req.method} not allowed`)
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }
  const { priceId } = req.body
  if (!priceId) return res.status(400).json({ error: 'priceId required' })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    cancel_url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  })

  res.status(200).json({ url: session.url })
}
