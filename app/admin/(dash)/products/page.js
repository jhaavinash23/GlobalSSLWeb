import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import ProductsEditor from './products-editor'

async function isAdmin() {
  const c = await cookies()
  const token = c.get('gssl_admin')?.value
  if (!token) return false
  const secret = process.env.ADMIN_SECRET || 'dev-secret-change-me'
  const expected = crypto.createHmac('sha256', secret).update('admin-session-v1').digest('hex')
  try { return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expected, 'hex')) } catch { return false }
}

export const metadata = { title: 'Products — Admin' }

export default async function Page() {
  if (!(await isAdmin())) redirect('/admin/login')
  return <ProductsEditor />
}
