'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const params = useParams()
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    if (pw !== pw2) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.token, password: pw }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      setDone(true); toast.success('Password updated')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) { toast.error(err.message); setLoading(false) }
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6"><div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white"><ShieldCheck className="h-5 w-5" /></div><span className="text-lg font-semibold">GlobalSSL<span className="text-blue-600">Web</span></span></Link>
        <div className="card-elevated p-8">
          {done ? (
            <div className="text-center py-4"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-3 text-lg font-bold">Password updated</h1><p className="mt-2 text-sm text-slate-600">Redirecting you to sign in...</p></div>
          ) : (
            <>
              <h1 className="text-xl font-bold">Choose a new password</h1>
              <p className="mt-1 text-sm text-slate-500">At least 6 characters.</p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div><Label className="text-xs">New password</Label><Input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Confirm</Label><Input type="password" required value={pw2} onChange={e => setPw2(e.target.value)} className="mt-1" /></div>
                <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update password'}</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
