'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, LogIn, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || 'Login failed')
        setLoading(false)
        return
      }
      toast.success('Welcome, admin!')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      toast.error('Network error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30"><ShieldCheck className="h-6 w-6" /></div>
          <span className="text-xl font-semibold text-white tracking-tight">GlobalSSL<span className="text-blue-400">Web</span></span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 backdrop-blur p-8 shadow-2xl">
          <h1 className="text-xl font-bold text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-400">Enter your admin password to manage products, pricing and margins.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter admin password" className="mt-1.5 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500" required autoFocus />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading || !password}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Sign in</>}
            </Button>
          </form>
          <p className="mt-6 text-[11px] text-slate-500 text-center">Change ADMIN_PASSWORD in the environment before production.</p>
        </div>
      </div>
    </div>
  )
}
