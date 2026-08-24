// Admin auth helpers. HMAC-SHA256(ADMIN_SECRET, 'admin-session-v1') as a signed cookie.
import crypto from 'crypto'

const COOKIE_NAME = 'gssl_admin'
const PAYLOAD = 'admin-session-v1'

export function expectedToken() {
  const secret = process.env.ADMIN_SECRET || 'dev-secret-change-me'
  return crypto.createHmac('sha256', secret).update(PAYLOAD).digest('hex')
}

export function verifyAdminRequest(request) {
  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(cookieHeader.split(';').map(c => {
    const [k, ...v] = c.trim().split('=')
    return [k, v.join('=')]
  }))
  const token = cookies[COOKIE_NAME]
  if (!token) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken(), 'hex'))
  } catch { return false }
}

export function setAdminCookie(response) {
  const token = expectedToken()
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=Lax`)
  return response
}

export function clearAdminCookie(response) {
  response.headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  return response
}

export const COOKIE = COOKIE_NAME
