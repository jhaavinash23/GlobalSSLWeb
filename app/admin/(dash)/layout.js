import { Toaster } from 'sonner'
import Link from 'next/link'
import { ShieldCheck, LayoutDashboard, Package, LogOut, ClipboardList, Users, LifeBuoy } from 'lucide-react'

export const metadata = { title: 'Admin', description: 'GlobalSSLWeb Admin' }

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0 bg-slate-900 text-slate-100 border-r border-slate-800">
          <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-semibold leading-none">GlobalSSL<span className="text-blue-400">Web</span></div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">Admin</div>
            </div>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-1 text-sm">
            <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            <Link href="/admin/products" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"><Package className="h-4 w-4" /> Products</Link>
            <Link href="/admin/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"><ClipboardList className="h-4 w-4" /> Orders</Link>
            <Link href="/admin/users" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"><Users className="h-4 w-4" /> Users</Link>
            <Link href="/admin/tickets" className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"><LifeBuoy className="h-4 w-4" /> Support</Link>
          </nav>
          <div className="p-4 border-t border-slate-800">
            <form action="/api/admin/logout" method="POST">
              <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
            </form>
          </div>
        </aside>
        <div className="flex-1 md:ml-64 min-h-screen">
          <div className="md:hidden flex h-14 items-center justify-between px-4 border-b bg-white">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white"><ShieldCheck className="h-4 w-4" /></div>
              <span className="text-sm font-semibold">Admin</span>
            </Link>
            <form action="/api/admin/logout" method="POST"><button className="text-xs text-slate-500">Sign out</button></form>
          </div>
          {children}
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
