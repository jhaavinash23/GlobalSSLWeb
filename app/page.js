import Link from 'next/link'
import { ShieldCheck, Zap, Award, Globe, Lock, HeadphonesIcon, RefreshCw, CheckCircle2, ArrowRight, Sparkles, Building2, Mail, FileCode2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import ProductCard from '@/components/site/product-card'
import { formatINR } from '@/lib/format'

async function getFeatured() {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || ''
    const res = await fetch(`${base}/api/products?featured=true&limit=6`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.items || []
  } catch { return [] }
}

const CATEGORY_CARDS = [
  { slug: 'dv-ssl', name: 'DV SSL', tag: 'Fastest', icon: Zap, desc: 'Domain validated. Issued in minutes.', color: 'from-blue-500 to-blue-600' },
  { slug: 'ov-ssl', name: 'OV SSL', tag: 'Business', icon: Building2, desc: 'Verified business identity.', color: 'from-emerald-500 to-emerald-600' },
  { slug: 'ev-ssl', name: 'EV SSL', tag: 'Highest Trust', icon: Award, desc: 'The gold standard for ecommerce.', color: 'from-amber-500 to-amber-600' },
  { slug: 'wildcard-ssl', name: 'Wildcard', tag: 'Unlimited', icon: Globe, desc: 'Secure unlimited subdomains.', color: 'from-purple-500 to-purple-600' },
  { slug: 'multi-domain-ssl', name: 'Multi-Domain', tag: 'Up to 250', icon: Globe, desc: 'Multiple domains in one cert.', color: 'from-indigo-500 to-indigo-600' },
  { slug: 'code-signing', name: 'Code Signing', tag: 'Publisher trust', icon: FileCode2, desc: 'Sign apps and executables.', color: 'from-slate-700 to-slate-900' },
  { slug: 'email-smime', name: 'Email S/MIME', tag: 'Encrypted mail', icon: Mail, desc: 'Sign and encrypt emails.', color: 'from-rose-500 to-rose-600' },
]

const BRANDS_TRUST = ['Sectigo','DigiCert','GeoTrust','RapidSSL','Thawte','Entrust']

const WHY_ITEMS = [
  { icon: ShieldCheck, title: 'Trusted CAs', desc: 'Certificates from Sectigo, DigiCert, GeoTrust, Thawte and more.' },
  { icon: Zap, title: 'Fast Issuance', desc: 'DV in minutes. OV and EV in a few business days.' },
  { icon: Award, title: 'Warranties up to ₹20 crore', desc: 'Real financial protection from top CAs.' },
  { icon: RefreshCw, title: 'Free Reissues', desc: 'Unlimited reissues during your certificate lifecycle.' },
  { icon: HeadphonesIcon, title: 'Installation Help', desc: 'Expert support to install on any server.' },
  { icon: Lock, title: 'Secure Payments', desc: 'PCI-DSS compliant checkout · encrypted end-to-end.' },
]

const COMPARE = [
  { feat: 'Validation', dv: 'Domain only', ov: 'Domain + Business', ev: 'Rigorous business + legal' },
  { feat: 'Best for', dv: 'Blogs, personal sites', ov: 'Company websites, portals', ev: 'Ecommerce, banking, fintech' },
  { feat: 'Issuance time', dv: '5–10 minutes', ov: '1–3 business days', ev: '3–5 business days' },
  { feat: 'Trust level', dv: 'Standard padlock', ov: 'Padlock + business name', ev: 'Highest browser trust' },
  { feat: 'Warranty', dv: '₹10K – ₹8.5L', ov: '₹12.5L – ₹83L', ev: '₹12.5L – ₹20Cr' },
  { feat: 'Starting price', dv: formatINR(599), ov: formatINR(2999), ev: formatINR(8999) },
]

const FAQ = [
  { q: 'What is an SSL certificate?', a: 'An SSL certificate encrypts data between a user’s browser and your server. It also validates your website identity, showing a padlock and enabling HTTPS.' },
  { q: 'How do I choose between DV, OV and EV?', a: 'DV is best for blogs and personal sites. OV suits business websites that want to display company identity. EV is required for ecommerce, banking, and finance where trust is critical.' },
  { q: 'How fast will I receive my SSL?', a: 'DV certificates are issued in a few minutes. OV takes 1–3 business days and EV takes 3–5 business days depending on validation.' },
  { q: 'Can I get a refund?', a: 'Yes. Most certificates are refundable within 30 days of purchase. Refund windows depend on the certificate authority.' },
  { q: 'Do you offer installation support?', a: 'Yes. Our experts help you install your SSL on any server (Nginx, Apache, IIS, cPanel, Plesk and more) at no extra cost.' },
  { q: 'What is a wildcard SSL?', a: 'A wildcard SSL secures your main domain and unlimited subdomains under it — e.g. *.example.com covers app.example.com, api.example.com and more.' },
]

export default async function HomePage() {
  const featured = await getFeatured()
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-radial" />
        <div className="absolute inset-0 grid-lines opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="container-x relative pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <div className="badge-soft"><Sparkles className="h-3.5 w-3.5" /> Trusted by 10,000+ businesses worldwide</div>
              <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05] text-balance">Secure Your <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Digital World</span></h1>
              <p className="mt-5 max-w-xl text-lg text-slate-600 text-balance">Premium SSL certificates from Sectigo, DigiCert, GeoTrust and other world-class authorities. Fast issuance, real warranties, expert installation support — starting at ₹599/year.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 px-6 text-[15px]"><Link href="/ssl-certificates">Browse SSL Certificates <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-[15px]"><Link href="#compare">Compare Certificates</Link></Button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                <div><div className="text-2xl font-bold text-slate-900">99.9%</div><div className="text-xs text-slate-500">Browser trust</div></div>
                <div><div className="text-2xl font-bold text-slate-900">5 min</div><div className="text-xs text-slate-500">Issuance</div></div>
                <div><div className="text-2xl font-bold text-slate-900">256-bit</div><div className="text-xs text-slate-500">Encryption</div></div>
              </div>
            </div>
            {/* Visual */}
            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-2xl" />
              <div className="card-elevated relative p-6 md:p-8">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500 text-white"><Lock className="h-3.5 w-3.5" /></div>
                  <span className="text-xs font-mono text-slate-700">https://yourbusiness.com</span>
                  <span className="ml-auto rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Secure</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Certificate issued by DigiCert Inc.</div>
                      <div className="text-xs text-slate-500">Extended Validation · 256-bit encryption · Valid for 1 year</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{k:'Validation',v:'EV'},{k:'Encryption',v:'AES-256'},{k:'Warranty',v:'₹20 Cr'},{k:'Reissues',v:'Unlimited'}].map(x=>(
                      <div key={x.k} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{x.k}</div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900">{x.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-800">Trusted by 99.9% of browsers worldwide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-slate-200 bg-white">
        <div className="container-x py-8">
          <div className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500">Certificates from the world’s most trusted authorities</div>
          <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-6 items-center">
            {BRANDS_TRUST.map(b => (
              <div key={b} className="text-center text-lg md:text-xl font-bold tracking-tight text-slate-400 hover:text-slate-700 transition">{b}</div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-x py-20">
        <div className="max-w-2xl">
          <div className="badge-soft">Product categories</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Every certificate for every use case</h2>
          <p className="mt-3 text-slate-600">From personal blogs to enterprise ecommerce, we’ve got the exact certificate your business needs.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORY_CARDS.map(c => {
            const Icon = c.icon
            return (
              <Link key={c.slug} href={`/ssl-certificates?category=${c.slug}`} className="group card-elevated p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-sm`}><Icon className="h-5 w-5" /></div>
                <div className="mt-4 flex items-center gap-2"><h3 className="text-base font-semibold text-slate-900">{c.name}</h3><span className="text-[10px] font-medium rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{c.tag}</span></div>
                <p className="mt-1 text-sm text-slate-600">{c.desc}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition">Explore <ArrowRight className="ml-1 h-3.5 w-3.5" /></div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container-x py-8">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <div className="badge-soft">Featured</div>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Most popular certificates</h2>
          </div>
          <Link href="/ssl-certificates" className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">Browse all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {featured.length === 0 ? (
          <div className="card-elevated p-10 text-center"><p className="text-sm text-slate-600">Loading products…</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* WHY */}
      <section className="container-x py-20">
        <div className="max-w-2xl">
          <div className="badge-soft">Why GlobalSSLWeb</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Everything a modern business needs</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {WHY_ITEMS.map(w => {
            const Icon = w.icon
            return (
              <div key={w.title} className="card-elevated p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{w.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{w.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="container-x py-20">
        <div className="max-w-2xl">
          <div className="badge-soft">SSL comparison</div>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">DV vs OV vs EV</h2>
          <p className="mt-3 text-slate-600">Choose the right validation level for your business.</p>
        </div>
        <div className="mt-10 card-elevated overflow-hidden">
          <div className="grid grid-cols-4 border-b border-slate-200">
            <div className="p-5 text-xs font-semibold uppercase tracking-wider text-slate-500">Feature</div>
            {[{k:'DV',c:'text-blue-700 bg-blue-50/60'},{k:'OV',c:'text-emerald-700 bg-emerald-50/60'},{k:'EV',c:'text-amber-700 bg-amber-50/60'}].map(h=>(
              <div key={h.k} className={`p-5 text-center text-sm font-bold ${h.c}`}>{h.k}</div>
            ))}
          </div>
          {COMPARE.map((r, idx) => (
            <div key={r.feat} className={`grid grid-cols-4 items-center border-b border-slate-100 last:border-0 ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
              <div className="p-5 text-sm font-medium text-slate-700">{r.feat}</div>
              <div className="p-5 text-sm text-slate-700 text-center">{r.dv}</div>
              <div className="p-5 text-sm text-slate-700 text-center">{r.ov}</div>
              <div className="p-5 text-sm text-slate-700 text-center">{r.ev}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-x py-20">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="badge-soft">FAQ</div>
            <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Questions? We have answers.</h2>
            <p className="mt-3 text-slate-600">Everything you need to know about SSL certificates and our marketplace.</p>
          </div>
          <div className="lg:col-span-2 card-elevated p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-slate-100 last:border-0">
                  <AccordionTrigger className="px-4 text-left text-[15px] font-semibold text-slate-900 hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="px-4 text-sm text-slate-600 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-10 md:p-16 text-white">
          <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)', backgroundSize:'40px 40px'}} />
          <div className="relative max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Ready to secure your website?</h2>
            <p className="mt-3 text-blue-50">Get your SSL certificate in minutes. Backed by expert installation support and unlimited free reissues.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6"><Link href="/ssl-certificates">Browse Certificates</Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"><Link href="#compare">Compare Plans</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
