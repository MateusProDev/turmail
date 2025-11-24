import React, { useEffect, useState } from 'react'
import { auth } from '../lib/firebaseClient'
import { onAuthStateChanged, signOut } from 'firebase/auth'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return () => unsub()
  }, [])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const timestamp = Math.floor(Date.now() / 1000)
      const sigRes = await fetch('/api/cloudinary-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp })
      })
      const { signature } = await sigRes.json()

      const form = new FormData()
      form.append('file', file)
      form.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '')
      form.append('timestamp', String(timestamp))
      form.append('signature', signature)

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form
      })
      const data = await uploadRes.json()
      setImageUrl(data.secure_url)
      setMessage('Upload concluído')
    } catch (err: any) {
      setMessage(err.message || 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  async function handleSendTest() {
    if (!user) return setMessage('Faça login')
    const to = prompt('Enviar para (email)')
    if (!to) return
    const subject = 'Teste Turmail'
    const html = `<p>Olá — este é um teste do Turmail.</p>`

    const res = await fetch('/api/brevo-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html })
    })
    if (res.ok) setMessage('Email enviado (via Brevo)')
    else setMessage('Erro ao enviar')
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <div>
            {user ? (
              <>
                <span className="mr-3">{user.email}</span>
                <button className="px-3 py-1 border rounded" onClick={() => signOut(auth)}>Sair</button>
              </>
            ) : (
              <a href="/auth/login" className="px-3 py-1 border rounded">Entrar</a>
            )}
          </div>
        </div>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Upload de imagem (Cloudinary)</h2>
          <form onSubmit={handleUpload} className="flex gap-2">
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <button className="px-3 py-1 bg-blue-600 text-white rounded" disabled={uploading}>{uploading ? 'Enviando...' : 'Enviar'}</button>
          </form>
          {imageUrl && <div className="mt-3"><img src={imageUrl} alt="uploaded" className="max-w-xs" /></div>}
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-2">Enviar email de teste</h2>
          <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleSendTest}>Enviar teste (Brevo)</button>
        </section>

        <p className="text-sm text-gray-600 mt-4">{message}</p>
      </div>
    </div>
  )
}
