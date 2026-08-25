'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AuthForm({ mode }) {
  const isLogin = mode === 'login'
  const router = useRouter()
  const [f, setF] = useState({ name: '', email: '', password: '', phone: '', company: '' })
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed')
      toast.success(isLogin ? 'Welcome back!' : 'Account created!')
      router.push('/account')
      router.refresh()
    } catch (err) { toast.error(err.message); setLoading(false) }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20"><ShieldCheck className="h-5 w-5" /></div>
          <span className="text-lg font-semibold tracking-tight">GlobalSSL<span className="text-blue-600">Web</span></span>
        </Link>
        <div className="card-elevated p-8">
          <h1 className="text-xl font-bold text-slate-900">{isLogin ? 'Sign in to your account' : 'Create your account'}</h1>
          <p className="mt-1 text-sm text-slate-500">{isLogin ? 'Access your orders, renewals and issued certificates.' : 'Track orders, download certificates, and manage renewals.'}</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            {!isLogin && (
              <div><Label className="text-xs">Full name</Label><Input value={f.name} onChange={e => set('name', e.target.value)} className="mt-1" required /></div>
            )}
            <div><Label className="text-xs">Email</Label><Input type="email" value={f.email} onChange={e => set('email', e.target.value.toLowerCase())} className="mt-1" required /></div>
            <div><Label className="text-xs">Password</Label><Input type="password" value={f.password} onChange={e => set('password', e.target.value)} className="mt-1" minLength={6} required /></div>
            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Phone</Label><Input value={f.phone} onChange={e => set('phone', e.target.value)} className="mt-1" /></div>
                <div><Label className="text-xs">Company</Label><Input value={f.company} onChange={e => set('company', e.target.value)} className="mt-1" /></div>
              </div>
            )}
            <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isLogin ? <><LogIn className="mr-2 h-4 w-4" />Sign in</> : <><UserPlus className="mr-2 h-4 w-4" />Create account</>}</Button>
          </form>
          <div className="mt-5 text-center text-sm text-slate-600">
            {isLogin ? (
              <>Don&apos;t have an account? <Link href="/register" className="text-blue-600 font-medium hover:underline">Sign up</Link>
              <div className="mt-2"><Link href="/forgot-password" className="text-xs text-slate-500 hover:text-slate-700">Forgot password?</Link></div></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
