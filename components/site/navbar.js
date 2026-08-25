'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShieldCheck, ShoppingCart, Menu, Search, X, User, LogOut, Package } from 'lucide-react'
import { useCart } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const NAV = [
  { href: '/ssl-certificates', label: 'SSL Certificates' },
  { href: '/ssl-certificates?category=code-signing', label: 'Code Signing' },
  { href: '/ssl-certificates?category=email-smime', label: 'Email S/MIME' },
  { href: '/#compare', label: 'Compare' },
  { href: '/#faq', label: 'FAQ' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const openCart = useCart(s => s.openCart)
  const count = useCart(s => s.items.reduce((a, i) => a + i.qty, 0))
  const [mobile, setMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState(null)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d?.user || null)).catch(() => {})
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])
  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setUser(null); toast.success('Signed out'); router.push('/') }
  // Hide public navbar on admin routes
  if (pathname?.startsWith('/admin')) return null
  return (
    <header className={cn('sticky top-0 z-40 w-full border-b transition-all', scrolled ? 'border-slate-200 bg-white/85 backdrop-blur-xl' : 'border-transparent bg-white/60 backdrop-blur-md')}>
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">GlobalSSL<span className="text-blue-600">Web</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-colors text-slate-600 hover:text-slate-900 hover:bg-slate-100', pathname === n.href && 'text-slate-900 bg-slate-100')}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/ssl-certificates" className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:text-slate-900 hover:border-slate-300 transition">
            <Search className="h-4 w-4" /> <span className="hidden lg:inline">Search certificates…</span>
            <kbd className="hidden lg:inline ml-6 rounded border border-slate-200 bg-slate-50 px-1.5 text-[10px] text-slate-500">/</kbd>
          </Link>
          <Button variant="ghost" size="icon" onClick={openCart} className="relative" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-[10px] font-semibold text-white ring-2 ring-white">{count}</span>
            )}
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm hover:border-slate-300">
                  <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white text-[11px] font-semibold">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                  <span className="text-slate-700 text-[13px] font-medium max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel><div className="font-semibold text-slate-900">{user.name}</div><div className="text-[11px] font-normal text-slate-500 truncate">{user.email}</div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/account"><User className="mr-2 h-4 w-4" />My account</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/account"><Package className="mr-2 h-4 w-4" />My orders</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex"><Link href="/login">Sign in</Link></Button>
          )}
          <Button asChild className="hidden md:inline-flex"><Link href="/ssl-certificates">Browse SSL</Link></Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobile(v => !v)} aria-label="Menu">
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {mobile && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container-x py-3 flex flex-col gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} onClick={() => setMobile(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">{n.label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
