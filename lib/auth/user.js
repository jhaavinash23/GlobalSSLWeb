import 'server-only'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'dev-secret'
const COOKIE = 'gssl_user'
const MAX_AGE = 30 * 24 * 60 * 60 // 30 days

export async function hashPassword(pw) { return bcrypt.hash(pw, 10) }
export async function verifyPassword(pw, hash) { return bcrypt.compare(pw, hash) }

export function signUserToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '30d' })
}

export function verifyUserToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export function verifyUserRequest(request) {
  const header = request.headers.get('cookie') || ''
  const cookies = Object.fromEntries(header.split(';').map(c => { const [k, ...v] = c.trim().split('='); return [k, v.join('=')] }))
  const token = cookies[COOKIE]
  if (!token) return null
  return verifyUserToken(token)
}

export function setUserCookie(response, user) {
  const token = signUserToken(user)
  response.headers.append('Set-Cookie', `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; SameSite=Lax`)
  return response
}

export function clearUserCookie(response) {
  response.headers.append('Set-Cookie', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`)
  return response
}

export const USER_COOKIE = COOKIE
