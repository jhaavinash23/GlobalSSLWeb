import 'server-only'
import PDFDocument from 'pdfkit'

const inr = (n) => 'INR ' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const cents = (n) => Math.round(Number(n || 0) * 100) / 100

// Convert number to words (Indian numbering — lakh/crore)
function amountInWords(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const two = (n) => n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '')
  const three = (n) => (n >= 100 ? a[Math.floor(n / 100)] + ' Hundred ' : '') + (n % 100 ? two(n % 100) : '')
  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  const parts = []
  const crore = Math.floor(rupees / 10000000)
  const lakh = Math.floor((rupees % 10000000) / 100000)
  const thousand = Math.floor((rupees % 100000) / 1000)
  const rest = rupees % 1000
  if (crore) parts.push(three(crore).trim() + ' Crore')
  if (lakh) parts.push(three(lakh).trim() + ' Lakh')
  if (thousand) parts.push(three(thousand).trim() + ' Thousand')
  if (rest) parts.push(three(rest).trim())
  let out = parts.join(' ').trim() || 'Zero'
  out += ' Rupees'
  if (paise) out += ' and ' + two(paise) + ' Paise'
  return out + ' Only'
}

const COMPANY = () => ({
  name: process.env.COMPANY_NAME || 'GlobalSSLWeb',
  gstin: process.env.COMPANY_GSTIN || '',
  address: process.env.COMPANY_ADDRESS || '',
  city: process.env.COMPANY_CITY || '',
  state: process.env.COMPANY_STATE || 'Karnataka',
  stateCode: process.env.COMPANY_STATE_CODE || '29',
  postalCode: process.env.COMPANY_POSTAL_CODE || '',
  email: process.env.COMPANY_EMAIL || '',
  phone: process.env.COMPANY_PHONE || '',
  hsn: process.env.COMPANY_HSN_CODE || '998319',
})

const BLUE = '#2563EB'
const DARK = '#0F172A'
const GREY = '#64748B'
const LIGHT = '#F1F5F9'

// Determine tax type by comparing company state code to buyer state name.
// If buyer state is empty or code differs, use IGST. Else split into CGST+SGST.
function taxSplit(order, company) {
  const buyerState = (order.billing?.state || '').toLowerCase().trim()
  const compState = (company.state || '').toLowerCase().trim()
  const intraState = buyerState && (buyerState === compState || buyerState.includes(compState) || compState.includes(buyerState))
  return intraState ? 'INTRA' : 'INTER'
}

export function invoiceNumberFromCounter(n) {
  const now = new Date()
  const fyStart = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear()
  const fy = `${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`
  return `GSSL/${fy}/${String(n).padStart(5, '0')}`
}

export async function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    try {
      const company = COMPANY()
      const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Invoice ${order.invoiceNumber || order.orderNumber}`, Author: company.name } })
      const chunks = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - 80

      // Header — logo mark (drawn as shapes) + company info
      // Blue rounded square with white check shield
      doc.save()
      doc.roundedRect(40, 40, 42, 42, 10).fill(BLUE)
      doc.fillColor('white').polygon([61, 50], [77, 55], [77, 66], [69, 74], [61, 78], [53, 74], [45, 66], [45, 55]).fill()
      // check
      doc.strokeColor(BLUE).lineWidth(2)
      doc.moveTo(54, 63).lineTo(60, 68).lineTo(70, 58).stroke()
      doc.restore()

      // Company text
      doc.fontSize(16).fillColor(DARK).font('Helvetica-Bold').text(company.name, 92, 42)
      doc.fontSize(9).fillColor(GREY).font('Helvetica')
      doc.text(company.address, 92, 62)
      doc.text(`${company.city}${company.postalCode ? ' — ' + company.postalCode : ''}, ${company.state}, India`)
      doc.text(`GSTIN: ${company.gstin}  ·  Email: ${company.email}  ·  Phone: ${company.phone}`)

      // Right side — Invoice title
      doc.fontSize(22).fillColor(DARK).font('Helvetica-Bold').text('TAX INVOICE', 380, 42, { width: 175, align: 'right' })
      doc.fontSize(9).fillColor(GREY).font('Helvetica')
      doc.text(`Invoice No: ${order.invoiceNumber || '—'}`, 380, 68, { width: 175, align: 'right' })
      doc.text(`Invoice Date: ${new Date(order.invoicedAt || order.updatedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 380, 82, { width: 175, align: 'right' })
      doc.text(`Order: ${order.orderNumber}`, 380, 96, { width: 175, align: 'right' })

      // Divider
      let y = 118
      doc.moveTo(40, y).lineTo(555, y).strokeColor(LIGHT).lineWidth(1).stroke()
      y += 12

      // Bill To / Ship To
      const billTop = y
      doc.fontSize(9).fillColor(GREY).font('Helvetica-Bold').text('BILL TO', 40, billTop)
      doc.fontSize(10).fillColor(DARK).font('Helvetica-Bold').text(order.customer.name || '', 40, billTop + 14)
      doc.font('Helvetica').fontSize(9).fillColor(DARK)
      const bill = order.billing || {}
      if (order.customer.company) doc.text(order.customer.company, 40, doc.y)
      if (bill.address) doc.text(bill.address, 40, doc.y)
      const cityLine = [bill.city, bill.state, bill.postalCode].filter(Boolean).join(', ')
      if (cityLine) doc.text(cityLine, 40, doc.y)
      if (bill.country) doc.text(bill.country, 40, doc.y)
      if (order.customer.email) doc.text(`Email: ${order.customer.email}`, 40, doc.y)
      if (order.customer.phone) doc.text(`Phone: ${order.customer.phone}`, 40, doc.y)
      if (order.gst?.gstNumber) {
        doc.font('Helvetica-Bold').text(`GSTIN: ${order.gst.gstNumber}`, 40, doc.y)
        doc.font('Helvetica')
      }

      // Right — Payment info block
      const payTop = billTop
      doc.fontSize(9).fillColor(GREY).font('Helvetica-Bold').text('PAYMENT DETAILS', 320, payTop, { width: 235, align: 'left' })
      doc.font('Helvetica').fontSize(9).fillColor(DARK)
      doc.text(`Method:  ${(order.paymentMethod || 'manual').toUpperCase()}`, 320, payTop + 14)
      doc.text(`Status:  ${order.paymentStatus || 'PAID'}`, 320, doc.y)
      doc.text(`Place of Supply:  ${bill.state || bill.country || '—'}${taxSplit(order, company) === 'INTRA' ? ' (' + company.stateCode + ')' : ' — Inter-state'}`, 320, doc.y)

      y = Math.max(doc.y, 240) + 14
      doc.moveTo(40, y).lineTo(555, y).strokeColor(LIGHT).lineWidth(1).stroke()
      y += 10

      // Items table header
      doc.rect(40, y, 515, 22).fill(DARK)
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      doc.text('#', 46, y + 7, { width: 16 })
      doc.text('Description', 62, y + 7, { width: 240 })
      doc.text('HSN/SAC', 302, y + 7, { width: 55, align: 'right' })
      doc.text('Qty', 357, y + 7, { width: 30, align: 'right' })
      doc.text('Rate', 387, y + 7, { width: 65, align: 'right' })
      doc.text('Taxable', 452, y + 7, { width: 65, align: 'right' })
      doc.text('Amount', 517, y + 7, { width: 33, align: 'right' })
      y += 22

      // Items rows — subtotal is inclusive of nothing (excl tax); tax is added below
      let taxableSum = 0
      doc.font('Helvetica').fontSize(9).fillColor(DARK)
      order.items.forEach((it, i) => {
        const rate = it.price
        const qty = it.qty
        const taxable = cents(rate * qty)
        taxableSum = cents(taxableSum + taxable)
        const rowH = 34
        // zebra
        if (i % 2 === 1) doc.rect(40, y, 515, rowH).fill(LIGHT).fillColor(DARK)
        doc.fillColor(DARK).font('Helvetica')
        doc.text(String(i + 1), 46, y + 6, { width: 16 })
        doc.font('Helvetica-Bold').fillColor(DARK).text(it.name, 62, y + 5, { width: 240 })
        doc.font('Helvetica').fillColor(GREY).fontSize(8)
        doc.text(`${it.brandName} · ${it.validation}${it.wildcard ? ' · Wildcard' : ''}${it.multiDomain ? ' · Multi-Domain' : ''} · Warranty ${it.warranty || '—'}`, 62, y + 18, { width: 240 })
        doc.fillColor(DARK).fontSize(9).font('Helvetica')
        doc.text(company.hsn, 302, y + 12, { width: 55, align: 'right' })
        doc.text(String(qty), 357, y + 12, { width: 30, align: 'right' })
        doc.text(rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 387, y + 12, { width: 65, align: 'right' })
        doc.text(taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 452, y + 12, { width: 65, align: 'right' })
        doc.text(taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 517, y + 12, { width: 33, align: 'right' })
        y += rowH
      })

      // Totals block
      y += 6
      doc.moveTo(40, y).lineTo(555, y).strokeColor(LIGHT).lineWidth(1).stroke()
      y += 8

      const split = taxSplit(order, company)
      const gstRate = 0.18
      const totalTax = cents(taxableSum * gstRate)
      const grandTotal = cents(taxableSum + totalTax)
      const roundOff = cents(Math.round(grandTotal) - grandTotal)
      const finalTotal = cents(grandTotal + roundOff)

      const totRow = (label, val, bold = false, color = DARK) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(color).fontSize(bold ? 10 : 9)
        doc.text(label, 330, y, { width: 150, align: 'right' })
        doc.text(inr(val), 480, y, { width: 75, align: 'right' })
        y += bold ? 18 : 15
      }
      totRow('Taxable Value', taxableSum)
      if (split === 'INTRA') {
        totRow(`CGST @ 9%`, cents(totalTax / 2))
        totRow(`SGST @ 9%`, cents(totalTax / 2))
      } else {
        totRow(`IGST @ 18%`, totalTax)
      }
      if (roundOff !== 0) totRow('Round off', roundOff, false, GREY)
      // Divider
      doc.moveTo(330, y).lineTo(555, y).strokeColor(LIGHT).lineWidth(1).stroke(); y += 6
      totRow('Grand Total', finalTotal, true, BLUE)

      y += 6
      doc.fontSize(9).font('Helvetica-Oblique').fillColor(GREY)
      doc.text('Amount in words: ' + amountInWords(finalTotal), 40, y, { width: 515 })
      y += 22

      // Terms & signature
      doc.moveTo(40, y).lineTo(555, y).strokeColor(LIGHT).lineWidth(1).stroke(); y += 10
      doc.fontSize(9).fillColor(GREY).font('Helvetica-Bold').text('Terms & notes', 40, y)
      doc.font('Helvetica').fontSize(8).fillColor(GREY)
      doc.text('• This is a computer-generated invoice and does not require a physical signature.', 40, doc.y + 4)
      doc.text('• SSL certificates are digital services (SAC ' + company.hsn + ').', 40, doc.y)
      doc.text('• Support: ' + company.email + ' · ' + company.phone, 40, doc.y)
      doc.text('• Refunds handled per the refund policy on ' + (process.env.NEXT_PUBLIC_BASE_URL || 'globalsslweb.com') + '.', 40, doc.y)

      // Right — signature block
      doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text('For ' + company.name, 400, y, { width: 155, align: 'right' })
      doc.fontSize(8).font('Helvetica').fillColor(GREY).text('Authorised Signatory', 400, y + 44, { width: 155, align: 'right' })

      doc.end()
    } catch (e) { reject(e) }
  })
}
