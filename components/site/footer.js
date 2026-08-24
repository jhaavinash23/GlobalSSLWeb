import Link from 'next/link'
import { ShieldCheck, Twitter, Github, Linkedin } from 'lucide-react'
import ClientHide from './client-hide'

function FooterInner() {
  const cols = [
    { title: 'Products', links: [
      { href: '/ssl-certificates?category=dv-ssl', label: 'DV SSL' },
      { href: '/ssl-certificates?category=ov-ssl', label: 'OV SSL' },
      { href: '/ssl-certificates?category=ev-ssl', label: 'EV SSL' },
      { href: '/ssl-certificates?category=wildcard-ssl', label: 'Wildcard' },
      { href: '/ssl-certificates?category=multi-domain-ssl', label: 'Multi-Domain' },
      { href: '/ssl-certificates?category=code-signing', label: 'Code Signing' },
      { href: '/ssl-certificates?category=email-smime', label: 'Email S/MIME' },
    ]},
    { title: 'Resources', links: [
      { href: '/#compare', label: 'Compare SSL' },
      { href: '/#faq', label: 'FAQ' },
      { href: '/ssl-certificates', label: 'Marketplace' },
    ]},
    { title: 'Company', links: [
      { href: '#', label: 'About' },
      { href: '#', label: 'Blog' },
      { href: '#', label: 'Careers' },
      { href: '#', label: 'Press' },
    ]},
    { title: 'Legal', links: [
      { href: '#', label: 'Terms' },
      { href: '#', label: 'Privacy' },
      { href: '#', label: 'Refund Policy' },
    ]},
  ]
  return (
    <footer className="mt-24 border-t border-slate-200 bg-white">
      <div className="container-x py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white"><ShieldCheck className="h-5 w-5" /></div>
              <span className="text-[15px] font-semibold tracking-tight">GlobalSSL<span className="text-blue-600">Web</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-600">Premium SSL and digital security certificates from the world’s most trusted certificate authorities.</p>
            <div className="mt-4 flex gap-2">
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"><Github className="h-4 w-4" /></a>
              <a href="#" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300"><Linkedin className="h-4 w-4" /></a>
            </div>
          </div>
          {cols.map(c => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.title}</div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(l => (
                  <li key={l.label}><Link href={l.href} className="text-sm text-slate-600 hover:text-slate-900">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} GlobalSSLWeb. All rights reserved.</p>
          <p className="text-xs text-slate-500">Backed by 256-bit encryption · Trusted by 99.9% of browsers</p>
        </div>
      </div>
    </footer>
  )
}

export default function Footer() {
  return <ClientHide prefix="/admin"><FooterInner /></ClientHide>
}
