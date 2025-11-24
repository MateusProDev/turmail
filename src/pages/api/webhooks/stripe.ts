import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { adminDb } from '../../../lib/firebaseAdmin'

// Use same API version as stripe client code
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

// Disable body parsing so we can inspect raw body
export const config = { api: { bodyParser: false } }

async function buffer(readable: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string | undefined
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !webhookSecret) {
    console.error('Missing stripe signature or webhook secret')
    return res.status(400).send('Missing signature or webhook secret')
  }

  let event: Stripe.Event

  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message ?? err)
    return res.status(400).send(`Webhook Error: ${err?.message ?? String(err)}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout session completed:', session.id)
        try {
          await adminDb.collection('checkout_sessions').doc(session.id).set({
            id: session.id,
            customer: typeof session.customer === 'string' ? session.customer : null,
            subscription: typeof session.subscription === 'string' ? session.subscription : null,
            amount_total: session.amount_total ?? null,
            payment_status: session.payment_status ?? null,
            metadata: session.metadata ?? {},
            mode: session.mode ?? null,
            createdAt: new Date(),
            raw: session
          })

          if (session.subscription && typeof session.subscription === 'string') {
            await adminDb.collection('subscriptions').doc(session.subscription).set({
              id: session.subscription,
              customer: typeof session.customer === 'string' ? session.customer : null,
              status: 'active',
              latest_session: session.id,
              metadata: session.metadata ?? {},
              updatedAt: new Date()
            }, { merge: true })
          }
        } catch (dbErr) {
          console.error('Error writing checkout session to Firestore:', dbErr)
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice paid:', invoice.id)
        try {
          if (invoice.subscription && typeof invoice.subscription === 'string') {
            await adminDb.collection('subscriptions').doc(invoice.subscription).set({
              id: invoice.subscription,
              customer: typeof invoice.customer === 'string' ? invoice.customer : null,
              latest_invoice: invoice.id,
              status: 'active',
              updatedAt: new Date()
            }, { merge: true })
          }

          await adminDb.collection('invoices').doc(invoice.id).set({
            id: invoice.id,
            subscription: typeof invoice.subscription === 'string' ? invoice.subscription : null,
            status: invoice.status,
            amount_paid: invoice.amount_paid ?? null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            createdAt: new Date(),
            raw: invoice
          })
        } catch (dbErr) {
          console.error('Error writing invoice to Firestore:', dbErr)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Invoice payment failed:', invoice.id)
        try {
          if (invoice.subscription && typeof invoice.subscription === 'string') {
            await adminDb.collection('subscriptions').doc(invoice.subscription).set({
              id: invoice.subscription,
              status: 'past_due',
              latest_invoice: invoice.id,
              updatedAt: new Date()
            }, { merge: true })
          }

          await adminDb.collection('invoices').doc(invoice.id).set({
            id: invoice.id,
            subscription: typeof invoice.subscription === 'string' ? invoice.subscription : null,
            status: invoice.status,
            amount_due: invoice.amount_due ?? null,
            createdAt: new Date(),
            raw: invoice
          })
        } catch (dbErr) {
          console.error('Error writing failed invoice to Firestore:', dbErr)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription event:', event.type, subscription.id)
        try {
          await adminDb.collection('subscriptions').doc(subscription.id).set({
            id: subscription.id,
            customer: typeof subscription.customer === 'string' ? subscription.customer : null,
            status: subscription.status,
            current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
            current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
            metadata: subscription.metadata ?? {},
            plan: (subscription.items?.data?.[0]?.price?.id) ?? null,
            raw: subscription,
            updatedAt: new Date()
          }, { merge: true })
        } catch (dbErr) {
          console.error('Error writing subscription to Firestore:', dbErr)
        }
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (err) {
    console.error('Error handling webhook event:', err)
    return res.status(500).end()
  }

  res.json({ received: true })
}

