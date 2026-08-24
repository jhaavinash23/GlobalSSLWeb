'use client'
import { usePathname } from 'next/navigation'

export default function ClientHide({ prefix, children }) {
  const pathname = usePathname()
  if (pathname?.startsWith(prefix)) return null
  return children
}
