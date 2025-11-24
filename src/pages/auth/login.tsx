import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../lib/firebaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Entrar</h2>
        <label className="block mb-2">Email</label>
        <input className="w-full p-2 border rounded mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="block mb-2">Senha</label>
        <input type="password" className="w-full p-2 border rounded mb-3" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-red-600 mb-2">{error}</p>}
        <button className="w-full py-2 bg-blue-600 text-white rounded">Entrar</button>
      </form>
    </div>
  )
}
