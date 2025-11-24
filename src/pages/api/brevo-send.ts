import type { NextApiRequest, NextApiResponse } from 'next'
import SibApiV3Sdk from 'sib-api-v3-sdk'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') {
    console.warn(`brevo-send: method ${req.method} not allowed`)
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }
  const { to, subject, html } = req.body
  if (!to || !subject) return res.status(400).json({ error: 'to and subject required' })

  const client = SibApiV3Sdk.ApiClient.instance
  const apiKey = client.authentications['api-key']
  apiKey.apiKey = process.env.BREVO_API_KEY || ''

  const api = new SibApiV3Sdk.TransactionalEmailsApi()
  try {
    console.log('brevo-send body:', req.body)
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.to = [{ email: to }]
    sendSmtpEmail.subject = subject
    sendSmtpEmail.htmlContent = html || ''

    const result = await api.sendTransacEmail(sendSmtpEmail)
    res.status(200).json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'send error' })
  }
}
