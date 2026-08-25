'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Logo from '@/components/site/logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setSent(true); toast.success('Check your inbox for reset instructions')
    } finally { setLoading(false) }
  }
  return (
    <div className="min-h-[calc(100vh-4rem)] grid place-items-center bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-6"><Logo size={40} /></Link>
        <div className="card-elevated p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50"><Mail className="h-6 w-6 text-emerald-600" /></div>
              <h1 className="mt-4 text-lg font-bold">Check your inbox</h1>
              <p className="mt-2 text-sm text-slate-600">If <b>{email}</b> is registered with us, you&apos;ll receive a password reset link within a minute.</p>
              <Button asChild variant="outline" className="mt-5"><Link href="/login">Back to sign in</Link></Button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500">Enter the email on your account and we&apos;ll send a reset link.</p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <div><Label className="text-xs">Email</Label><Input type="email" required value={email} onChange={e => setEmail(e.target.value.toLowerCase())} className="mt-1" /></div>
                <Button type="submit" className="w-full h-11" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}</Button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-500"><Link href="/login" className="hover:text-slate-700">← Back to sign in</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
