import type { NextApiRequest, NextApiResponse } from 'next'
import { adminAuth } from '../../lib/firebaseAdmin'
import { Queue } from 'bullmq'
import IORedis from 'ioredis'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const authHeader = req.headers.authorization || ''
  const match = authHeader.match(/^Bearer (.+)$/)
  if (!match) return res.status(401).json({ error: 'No token' })

  const idToken = match[1]
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    const userId = decoded.uid

    const { subject, html, to } = req.body
    if (!to || !subject) return res.status(400).json({ error: 'to and subject required' })

    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    const queue = new Queue('email', { connection })
    const job = await queue.add('send-email', { userId, to, subject, html })

    return res.status(200).json({ jobId: job.id })
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Invalid token' })
  }
}
