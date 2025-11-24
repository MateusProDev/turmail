import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { timestamp, public_id } = req.body
  if (!timestamp) return res.status(400).json({ error: 'timestamp required' })

  const secret = process.env.CLOUDINARY_API_SECRET || ''
  const toSign = `timestamp=${timestamp}` + (public_id ? `&public_id=${public_id}` : '')
  const signature = crypto.createHash('sha1').update(toSign + secret).digest('hex')

  res.status(200).json({ signature })
}
