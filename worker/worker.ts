import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

const emailQueue = new Queue('email', { connection })

new Worker(
  'email',
  async job => {
    console.log('Processing job', job.id, job.name, job.data)
    // TODO: call Brevo API here to send email
  },
  { connection }
)

console.log('Worker started')
