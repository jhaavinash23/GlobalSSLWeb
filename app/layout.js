import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Navbar from '@/components/site/navbar'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata = {
  title: {
    default: 'GlobalSSLWeb — Secure Your Digital World',
    template: '%s — GlobalSSLWeb',
  },
  description: 'Premium marketplace for SSL certificates and digital security products from Sectigo, DigiCert, GeoTrust, RapidSSL, Thawte and Entrust.',
  keywords: ['SSL certificate','DV SSL','OV SSL','EV SSL','Wildcard SSL','Multi-Domain SSL','Code Signing','S/MIME','Sectigo','DigiCert'],
  openGraph: {
    title: 'GlobalSSLWeb — Secure Your Digital World',
    description: 'Buy SSL certificates from the world’s top certificate authorities.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <CartDrawer />
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  )
}
