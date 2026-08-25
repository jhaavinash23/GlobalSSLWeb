import 'server-only'
import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM || 'GlobalSSLWeb <onboarding@resend.dev>'
let resend = null
if (apiKey) resend = new Resend(apiKey)

export async function sendEmail({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping send:', subject, '→', to)
    return { skipped: true }
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html })
    if (result.error) {
      console.error('[email] Resend error:', result.error)
      return { error: result.error.message }
    }
    return { id: result.data?.id }
  } catch (e) {
    console.error('[email] send exception:', e?.message)
    return { error: e?.message }
  }
}

const BASE = process.env.NEXT_PUBLIC_BASE_URL || ''

const wrap = (title, body) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px -12px rgba(15,23,42,.15);">
  <div style="background:#0F172A;padding:20px 24px;color:#fff;">
    <div style="font-size:18px;font-weight:700;letter-spacing:-.01em;">GlobalSSL<span style="color:#60A5FA">Web</span></div>
    <div style="font-size:11px;color:#94A3B8;text-transform:uppercase;letter-spacing:.1em;margin-top:2px;">${title}</div>
  </div>
  <div style="padding:28px 24px;color:#0F172A;font-size:14px;line-height:1.6;">${body}</div>
  <div style="padding:16px 24px;background:#F8FAFC;color:#64748B;font-size:11px;border-top:1px solid #E2E8F0;">Secure Your Digital World · GlobalSSLWeb</div>
</div></body></html>`

const btn = (href, label) => `<a href="${href}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;font-size:13px;margin-top:8px;">${label}</a>`
const codeBox = (txt) => `<pre style="background:#0F172A;color:#F1F5F9;padding:14px;border-radius:8px;font-size:11px;line-height:1.5;overflow-x:auto;white-space:pre-wrap;word-break:break-all;">${txt}</pre>`
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export function tplOrderPlaced(order) {
  const link = `${BASE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`
  const items = order.items.map(i => `<tr><td style="padding:6px 0;">${i.name} <span style="color:#64748B">× ${i.qty}</span></td><td style="padding:6px 0;text-align:right;font-weight:600;">${inr(i.lineTotal)}</td></tr>`).join('')
  return {
    subject: `Order confirmation · ${order.orderNumber}`,
    html: wrap('Order placed', `
      <h1 style="margin:0 0 4px;font-size:22px;">Thanks for your order, ${order.customer.name.split(' ')[0]}!</h1>
      <p style="color:#475569;margin:0 0 18px;">We've received order <b style="font-family:ui-monospace,monospace;">${order.orderNumber}</b>. Complete payment via UPI to <b>payments@globalsslweb</b> using this reference, then submit your CSR from the tracking page below.</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">${items}
        <tr><td style="padding-top:10px;border-top:1px solid #E2E8F0;color:#64748B;">Subtotal</td><td style="padding-top:10px;border-top:1px solid #E2E8F0;text-align:right;">${inr(order.subtotal)}</td></tr>
        <tr><td style="color:#64748B;">GST 18%</td><td style="text-align:right;">${inr(order.tax)}</td></tr>
        <tr><td style="font-weight:700;padding-top:6px;">Total</td><td style="font-weight:700;text-align:right;padding-top:6px;">${inr(order.total)}</td></tr>
      </table>
      <div style="text-align:center;margin-top:18px;">${btn(link, 'Track & manage order →')}</div>
      <p style="color:#64748B;font-size:12px;margin-top:20px;">You'll receive follow-up emails when payment is confirmed, when DCV instructions are ready, and when your certificate is issued.</p>
    `),
  }
}

export function tplPaymentConfirmed(order) {
  const link = `${BASE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`
  return {
    subject: `Payment received · ${order.orderNumber}`,
    html: wrap('Payment confirmed', `
      <h1 style="margin:0 0 4px;font-size:22px;">Payment received ✓</h1>
      <p style="color:#475569;">We've confirmed payment of <b>${inr(order.total)}</b> for order <b style="font-family:ui-monospace,monospace;">${order.orderNumber}</b>.</p>
      <p style="color:#475569;">Next step: generate a CSR on your server and submit it on your order page so we can request certificate issuance from the CA.</p>
      <div style="text-align:center;">${btn(link, 'Submit CSR →')}</div>
    `),
  }
}

export function tplDcvInstructions(order, item, itemIdx) {
  const link = `${BASE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`
  return {
    subject: `Action needed: Domain validation for ${item.name}`,
    html: wrap('DCV instructions', `
      <h1 style="margin:0 0 4px;font-size:22px;">Complete Domain Validation</h1>
      <p style="color:#475569;">Your CSR for <b>${item.name}</b> is submitted to <b>${item.brandName}</b>. Complete the validation instructions below exactly as shown to issue your certificate.</p>
      ${codeBox(item.fulfillment?.dcvInstructions || '')}
      <p style="color:#475569;">Once you've completed DCV, click <b>&quot;I've completed DCV&quot;</b> on your order page.</p>
      <div style="text-align:center;">${btn(link, 'Open my order →')}</div>
    `),
  }
}

export function tplCertificateIssued(order, item, itemIdx) {
  const link = `${BASE}/orders/${order.orderNumber}?email=${encodeURIComponent(order.customer.email)}`
  return {
    subject: `🎉 Certificate ready · ${item.name}`,
    html: wrap('Certificate issued', `
      <h1 style="margin:0 0 4px;font-size:22px;">Your certificate is ready 🎉</h1>
      <p style="color:#475569;">Your <b>${item.name}</b> certificate has been issued. You can download the certificate, CA chain and full bundle from your order page.</p>
      <p style="color:#475569;">Expires: <b>${item.fulfillment?.expiresAt ? new Date(item.fulfillment.expiresAt).toLocaleDateString('en-IN') : 'N/A'}</b></p>
      <div style="text-align:center;">${btn(link, 'Download my certificate →')}</div>
    `),
  }
}

export function tplWelcome(user) {
  const link = `${BASE}/account`
  return {
    subject: `Welcome to GlobalSSLWeb`,
    html: wrap('Account created', `
      <h1 style="margin:0 0 4px;font-size:22px;">Welcome, ${user.name.split(' ')[0]}!</h1>
      <p style="color:#475569;">Your account is ready. Sign in anytime to view your orders, download certificates, and manage renewals.</p>
      <div style="text-align:center;">${btn(link, 'Go to My Account →')}</div>
    `),
  }
}

export function tplPasswordReset(email, token) {
  const link = `${BASE}/reset-password/${token}`
  return {
    subject: `Reset your GlobalSSLWeb password`,
    html: wrap('Password reset', `
      <h1 style="margin:0 0 4px;font-size:22px;">Reset your password</h1>
      <p style="color:#475569;">We received a request to reset the password for <b>${email}</b>. Click below to choose a new password. This link expires in 1 hour.</p>
      <div style="text-align:center;">${btn(link, 'Reset password →')}</div>
      <p style="color:#64748B;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    `),
  }
}

export function tplAdminSetPassword(user, tempPassword) {
  const link = `${BASE}/login`
  return {
    subject: `Your GlobalSSLWeb password was reset`,
    html: wrap('Password reset by admin', `
      <h1 style="margin:0 0 4px;font-size:22px;">Your password was reset</h1>
      <p style="color:#475569;">Our support team has reset your password. Sign in using the temporary password below, then change it from your account.</p>
      ${codeBox(tempPassword)}
      <div style="text-align:center;">${btn(link, 'Sign in →')}</div>
    `),
  }
}

// ---------- Support tickets ----------
export function tplTicketCreated(t) {
  const link = `${BASE}/support/tickets/${t.ticketNumber}?email=${encodeURIComponent(t.email)}`
  return {
    subject: `Support ticket ${t.ticketNumber} created`,
    html: wrap('Ticket received', `
      <h1 style="margin:0 0 4px;font-size:22px;">We received your message</h1>
      <p style="color:#475569;">Ticket <b style="font-family:ui-monospace,monospace;">${t.ticketNumber}</b>. Our support team will reply within 24 business hours.</p>
      <div style="rounded:8px;background:#F8FAFC;border:1px solid #E2E8F0;padding:12px;border-radius:8px;margin:12px 0;">
        <div style="font-weight:600;">${t.subject}</div>
        <div style="color:#64748B;font-size:12px;margin-top:4px;white-space:pre-wrap;">${(t.messages[0]?.body || '').replace(/</g,'&lt;')}</div>
      </div>
      <div style="text-align:center;">${btn(link, 'View & reply →')}</div>
    `),
  }
}

export function tplTicketAdminReply(t, message) {
  const link = `${BASE}/support/tickets/${t.ticketNumber}?email=${encodeURIComponent(t.email)}`
  return {
    subject: `Reply on ticket ${t.ticketNumber} · ${t.subject}`,
    html: wrap('New reply from support', `
      <h1 style="margin:0 0 4px;font-size:22px;">Our team has replied</h1>
      <div style="rounded:8px;background:#F8FAFC;border:1px solid #E2E8F0;padding:12px;border-radius:8px;margin:12px 0;white-space:pre-wrap;color:#0F172A;font-size:13px;">${(message.body || '').replace(/</g,'&lt;')}</div>
      <div style="text-align:center;">${btn(link, 'View thread →')}</div>
    `),
  }
}

export function tplTicketCustomerReply(t, message) {
  const link = `${BASE}/admin/tickets/${t.ticketNumber}`
  return {
    subject: `Customer replied · ${t.ticketNumber}`,
    html: wrap('New customer reply', `
      <p style="color:#475569;">Ticket <b>${t.ticketNumber}</b> from ${t.name} (${t.email}):</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:12px;border-radius:8px;margin:12px 0;white-space:pre-wrap;color:#0F172A;font-size:13px;">${(message.body || '').replace(/</g,'&lt;')}</div>
      <div style="text-align:center;">${btn(link, 'Open in admin →')}</div>
    `),
  }
}

export function tplTicketNewAdmin(t) {
  const link = `${BASE}/admin/tickets/${t.ticketNumber}`
  return {
    subject: `New ticket · ${t.ticketNumber} · ${t.subject}`,
    html: wrap('New support ticket', `
      <p style="color:#475569;">${t.name} (${t.email}) opened ticket <b>${t.ticketNumber}</b>${t.orderNumber ? ` for order <b>${t.orderNumber}</b>` : ''}.</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;padding:12px;border-radius:8px;margin:12px 0;">
        <div style="font-weight:600;">${t.subject}</div>
        <div style="color:#64748B;font-size:12px;margin-top:4px;white-space:pre-wrap;">${(t.messages[0]?.body || '').replace(/</g,'&lt;')}</div>
      </div>
      <div style="text-align:center;">${btn(link, 'Open in admin →')}</div>
    `),
  }
}
