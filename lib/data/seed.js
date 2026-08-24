// GlobalSSLWeb catalogue.
// Prices are computed from the wholesale sheet using:
//   INR retail = round99(BUY_USD * 85 * markup)
//   INR original (MSRP strike) = round99(MSRP_USD * 85)
// Increment SEED_VERSION whenever this file changes to force a reseed.

export const SEED_VERSION = 4

const USD_TO_INR = 85
const round99 = (n) => Math.max(99, Math.round(n / 100) * 100 - 1)

// Markup by product tier — this is the commission we take on top of the wholesale price.
const MARKUP = {
  DV: 2.0,          // 100% margin on cheap DV certs
  DV_WC: 1.85,      // wildcard DV
  DV_MD: 1.85,      // multi-domain DV
  OV: 1.75,         // 75% margin
  OV_WC: 1.7,
  OV_MD: 1.7,
  EV: 1.6,          // 60% margin (higher price bands)
  EV_WC: 1.6,
  EV_MD: 1.6,
  CS: 1.8,          // code signing
  EV_CS: 1.7,       // EV code signing
  SMIME: 1.9,       // email S/MIME
}

// Compute retail + original prices from wholesale + MSRP in USD
const price = (buyUsd, msrpUsd, tier) => {
  const markup = MARKUP[tier] || 1.7
  // Fallback: if wholesale is 0 (freebie promo), price at 30% of MSRP so we still profit.
  const effectiveBuy = buyUsd > 0 ? buyUsd : msrpUsd * 0.15
  const retail = round99(effectiveBuy * USD_TO_INR * markup)
  const original = round99(msrpUsd * USD_TO_INR)
  return {
    price: retail,
    originalPrice: Math.max(original, retail + 200), // ensure original > price
    wholesalePriceUsd: buyUsd, // internal reference
    msrpUsd,
    markup, // stored on record so admin can tweak
    priceOverride: null, // if set, price uses this INR value directly
    usdToInr: USD_TO_INR,
  }
}

export const BRANDS = [
  { id: 'brand-sectigo',  slug: 'sectigo',  name: 'Sectigo',  description: 'Formerly Comodo CA. One of the world\u2019s largest commercial CAs.', website: 'https://sectigo.com',  color: '#c8102e' },
  { id: 'brand-digicert', slug: 'digicert', name: 'DigiCert', description: 'Premium certificate authority trusted by Fortune 500 companies.',      website: 'https://digicert.com', color: '#0a4d91' },
  { id: 'brand-geotrust', slug: 'geotrust', name: 'GeoTrust', description: 'Established CA offering business-grade SSL.',                          website: 'https://geotrust.com', color: '#e11d3f' },
  { id: 'brand-rapidssl', slug: 'rapidssl', name: 'RapidSSL', description: 'Fast-issuance domain validated SSL.',                                  website: 'https://rapidssl.com', color: '#f97316' },
  { id: 'brand-thawte',   slug: 'thawte',   name: 'Thawte',   description: 'Global CA with strong enterprise reputation.',                         website: 'https://thawte.com',   color: '#dc2626' },
  { id: 'brand-entrust',  slug: 'entrust',  name: 'Entrust',  description: 'Enterprise-grade PKI and identity certificates.',                      website: 'https://entrust.com',  color: '#111827' },
]

export const CATEGORIES = [
  { id: 'cat-dv',            slug: 'dv-ssl',           name: 'DV SSL',           validation: 'DV', description: 'Domain validated SSL. Fastest issuance.' },
  { id: 'cat-ov',            slug: 'ov-ssl',           name: 'OV SSL',           validation: 'OV', description: 'Organization validated SSL for businesses.' },
  { id: 'cat-ev',            slug: 'ev-ssl',           name: 'EV SSL',           validation: 'EV', description: 'Extended validation with the highest trust.' },
  { id: 'cat-wildcard',      slug: 'wildcard-ssl',     name: 'Wildcard SSL',     validation: 'DV', description: 'Secure unlimited subdomains under one certificate.' },
  { id: 'cat-multi',         slug: 'multi-domain-ssl', name: 'Multi-Domain SSL', validation: 'OV', description: 'Secure up to 250 domains on a single cert.' },
  { id: 'cat-codesigning',   slug: 'code-signing',     name: 'Code Signing',     validation: 'OV', description: 'Sign executables and drivers to remove security warnings.' },
  { id: 'cat-email',         slug: 'email-smime',      name: 'Email S/MIME',     validation: 'IV', description: 'Encrypt and digitally sign your emails.' },
]

const mk = (o) => ({ active: true, featured: false, currency: 'INR', createdAt: new Date(), browsers: ['Chrome','Firefox','Safari','Edge','Opera','iOS','Android'], ...o })

// Helper feature blocks
const F_STANDARD = ['Free unlimited reissues','99.9% browser compatibility','30-day money-back guarantee']
const F_OV = ['Full business verification','Static & dynamic site seal','Unlimited server licences']
const F_EV = ['Extended validation','Highest browser trust','Dynamic site seal','Unlimited reissues']
const F_WILDCARD = ['Unlimited subdomains','Single-cert renewal','Multi-server support']
const F_MULTI = ['Up to 250 SANs','Unified expiry date','Add/remove SANs anytime']

export const PRODUCTS = [
  // ============== SECTIGO ==============
  mk({
    id: 'p-sectigo-positivessl-dv', slug: 'sectigo-positivessl-dv',
    name: 'Sectigo PositiveSSL DV', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'dv-ssl', validation: 'DV',
    ...price(9, 100, 'DV'),
    warranty: '₹10,000', issuance: '5 minutes', encryption: '256-bit', wildcard: false, multiDomain: false, featured: true,
    shortDescription: 'Instant domain validated SSL from Sectigo. Perfect for blogs and small sites.',
    description: 'PositiveSSL is the world\u2019s most popular DV SSL. Issued in minutes, it delivers 256-bit encryption, a padlock in every major browser, and a ₹10,000 warranty. Ideal for personal sites, blogs, and low-transaction pages that need HTTPS immediately.',
    features: ['Issued in 5 minutes','256-bit SHA-2 encryption', ...F_STANDARD],
  }),
  mk({
    id: 'p-sectigo-positivessl-mdc', slug: 'sectigo-positivessl-multi-domain',
    name: 'Sectigo PositiveSSL Multi-Domain', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'multi-domain-ssl', validation: 'DV',
    ...price(23.12, 272, 'DV_MD'),
    warranty: '₹10,000', issuance: '5 minutes', encryption: '256-bit', wildcard: false, multiDomain: true,
    shortDescription: 'Secure up to 250 domains on a single Sectigo DV certificate.',
    description: 'Consolidate multiple domain SSLs into a single Sectigo PositiveSSL Multi-Domain certificate. Add up to 250 SANs, unified expiry date and instant DV issuance.',
    features: [...F_MULTI, 'Fast DV validation', '256-bit encryption', 'Free reissues'],
  }),
  mk({
    id: 'p-sectigo-positivessl-wc', slug: 'sectigo-positivessl-wildcard',
    name: 'Sectigo PositiveSSL Wildcard', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'wildcard-ssl', validation: 'DV', wildcard: true,
    ...price(138.32, 1064, 'DV_WC'),
    warranty: '₹10,000', issuance: '5 minutes', encryption: '256-bit', featured: true,
    shortDescription: 'Secure unlimited subdomains with a single Sectigo wildcard.',
    description: 'PositiveSSL Wildcard secures your primary domain plus unlimited subdomains (*.example.com). Ideal for SaaS platforms, staging environments, and multi-tenant apps.',
    features: [...F_WILDCARD, 'Instant issuance', '256-bit encryption', 'Free reissues'],
  }),
  mk({
    id: 'p-sectigo-ov', slug: 'sectigo-ov-ssl',
    name: 'Sectigo Business SSL (OV)', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'ov-ssl', validation: 'OV',
    ...price(9, 100, 'OV'),
    warranty: '₹2,50,000', issuance: '1-3 business days', encryption: '256-bit', featured: true,
    shortDescription: 'Show your verified business identity with Sectigo OV SSL.',
    description: 'Sectigo Business SSL includes verification of your organisation so visitors see your company name in the certificate details. Recommended for company websites, dashboards, and portals that handle user data.',
    features: [...F_OV, '₹2.5L warranty', 'Free reissues'],
  }),
  mk({
    id: 'p-sectigo-ov-mdc', slug: 'sectigo-business-multi-domain',
    name: 'Sectigo Business Multi-Domain (OV)', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'multi-domain-ssl', validation: 'OV', multiDomain: true,
    ...price(23.12, 272, 'OV_MD'),
    warranty: '₹2,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Verified business OV SSL that secures up to 250 domains.',
    description: 'Cover all your business domains with a single OV certificate from Sectigo. Displays verified organisation identity across every domain in the SAN list.',
    features: [...F_MULTI, ...F_OV],
  }),
  mk({
    id: 'p-sectigo-ov-wc', slug: 'sectigo-business-wildcard',
    name: 'Sectigo Business Wildcard (OV)', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'wildcard-ssl', validation: 'OV', wildcard: true,
    ...price(138.32, 1064, 'OV_WC'),
    warranty: '₹2,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Business-verified wildcard that secures unlimited subdomains.',
    description: 'Sectigo Business Wildcard combines verified organisation identity with unlimited-subdomain protection. Perfect for enterprise SaaS with many customer subdomains.',
    features: [...F_WILDCARD, ...F_OV],
  }),
  mk({
    id: 'p-sectigo-ev', slug: 'sectigo-ev-ssl',
    name: 'Sectigo EV SSL', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'ev-ssl', validation: 'EV',
    ...price(23, 230, 'EV'),
    warranty: '₹12,50,000', issuance: '3-5 business days', encryption: '256-bit', featured: true,
    shortDescription: 'The highest level of trust. Extended validation for ecommerce and finance.',
    description: 'Sectigo EV SSL is the gold standard. It requires the strictest identity verification and offers the highest visual trust. Absolute must for ecommerce checkouts, banking, and payment portals.',
    features: [...F_EV, '₹12.5L warranty'],
  }),
  mk({
    id: 'p-sectigo-ev-mdc', slug: 'sectigo-ev-multi-domain',
    name: 'Sectigo EV Multi-Domain SSL', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'multi-domain-ssl', validation: 'EV', multiDomain: true,
    ...price(68.2, 310, 'EV_MD'),
    warranty: '₹12,50,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'Enterprise EV validation across up to 250 domains.',
    description: 'Extended validation trust across your entire enterprise footprint. Sectigo EV Multi-Domain lets ecommerce and fintech companies protect every domain under one EV cert.',
    features: [...F_MULTI, ...F_EV],
  }),
  mk({
    id: 'p-sectigo-code-signing', slug: 'sectigo-code-signing',
    name: 'Sectigo Code Signing', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'code-signing', validation: 'OV',
    ...price(104.4, 696, 'CS'),
    warranty: 'N/A', issuance: '1-3 business days', encryption: 'SHA-2',
    shortDescription: 'Sign executables and drivers to remove "Unknown Publisher" warnings.',
    description: 'Sectigo Code Signing certificates verify the identity of software publishers and protect users from tampered downloads. Compatible with Windows, macOS, Java and Adobe AIR.',
    features: ['Windows/macOS/Java support','SHA-2 signatures','Removes SmartScreen warnings','Timestamp support','Free reissues'],
    browsers: ['Windows','macOS','Java','Adobe AIR'],
  }),
  mk({
    id: 'p-sectigo-ev-code-signing', slug: 'sectigo-ev-code-signing',
    name: 'Sectigo EV Code Signing', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'code-signing', validation: 'EV',
    ...price(311.04, 972, 'EV_CS'),
    warranty: 'N/A', issuance: '3-5 business days', encryption: 'SHA-2', featured: true,
    shortDescription: 'EV Code Signing — instant SmartScreen reputation, hardware token delivery.',
    description: 'Sectigo EV Code Signing includes rigorous business validation and ships on a FIPS-140-2 hardware token. Grants instant Microsoft SmartScreen reputation, so end users see zero download warnings from day one.',
    features: ['Extended validation','Ships on hardware token','Instant SmartScreen reputation','SHA-2 signatures','Timestamping support'],
    browsers: ['Windows','macOS','Java','Adobe AIR'],
  }),
  mk({
    id: 'p-sectigo-smime', slug: 'sectigo-email-smime',
    name: 'Sectigo Email S/MIME', brandSlug: 'sectigo', brandName: 'Sectigo',
    categorySlug: 'email-smime', validation: 'IV',
    ...price(9, 50, 'SMIME'),
    warranty: 'N/A', issuance: '1 hour', encryption: '256-bit',
    shortDescription: 'Digitally sign and encrypt your business emails.',
    description: 'S/MIME certificates ensure your emails are authentic and unreadable by intruders. Works with Outlook, Apple Mail, and most modern email clients.',
    features: ['Digital signing','End-to-end encryption','Outlook & Apple Mail','1-year validity','Free reissues'],
    browsers: ['Outlook','Apple Mail','Thunderbird','iOS Mail','Android'],
  }),

  // ============== RAPIDSSL ==============
  mk({
    id: 'p-rapidssl-standard', slug: 'rapidssl-standard-dv',
    name: 'RapidSSL Standard DV', brandSlug: 'rapidssl', brandName: 'RapidSSL',
    categorySlug: 'dv-ssl', validation: 'DV',
    ...price(15, 75, 'DV'),
    warranty: '₹8,50,000', issuance: '10 minutes', encryption: '256-bit',
    shortDescription: 'Speed-first DV SSL from RapidSSL. Great for personal sites.',
    description: 'RapidSSL is a lightweight DV SSL that ships in minutes. Ideal for hobby projects, personal blogs, and small internal tools.',
    features: ['Rapid issuance', '256-bit encryption', '₹8.5L warranty', ...F_STANDARD],
  }),
  mk({
    id: 'p-rapidssl-wildcard', slug: 'rapidssl-wildcard-dv',
    name: 'RapidSSL Wildcard DV', brandSlug: 'rapidssl', brandName: 'RapidSSL',
    categorySlug: 'wildcard-ssl', validation: 'DV', wildcard: true,
    ...price(96, 300, 'DV_WC'),
    warranty: '₹8,50,000', issuance: '10 minutes', encryption: '256-bit', featured: true,
    shortDescription: 'Affordable DV wildcard from RapidSSL — unlimited subdomains.',
    description: 'RapidSSL Wildcard is a budget-friendly way to secure your main domain plus unlimited subdomains. Great for growing SaaS and multi-tenant apps.',
    features: [...F_WILDCARD, '10-minute issuance', '256-bit encryption'],
  }),

  // ============== GEOTRUST ==============
  mk({
    id: 'p-geotrust-flex-dv', slug: 'geotrust-flex-dv',
    name: 'GeoTrust Flex DV', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'dv-ssl', validation: 'DV',
    ...price(2.5, 25, 'DV'),
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'Ultra-affordable DV SSL from GeoTrust.',
    description: 'GeoTrust Flex DV is the fastest way to secure any website with HTTPS. Issued in minutes, backed by the trusted GeoTrust brand.',
    features: ['Instant DV issuance', '256-bit encryption', '₹5L warranty', ...F_STANDARD],
  }),
  mk({
    id: 'p-geotrust-flex-dv-mdc', slug: 'geotrust-flex-dv-multi-domain',
    name: 'GeoTrust Flex DV Multi-Domain', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'multi-domain-ssl', validation: 'DV', multiDomain: true,
    ...price(41.75, 167, 'DV_MD'),
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'GeoTrust DV multi-domain — up to 250 SANs, fastest issuance.',
    description: 'Secure many domains with a single fast-issuance DV certificate from GeoTrust. Unified renewal saves ops time.',
    features: [...F_MULTI, 'Instant DV validation', '256-bit encryption'],
  }),
  mk({
    id: 'p-geotrust-flex-dv-wc', slug: 'geotrust-flex-dv-wildcard',
    name: 'GeoTrust Flex DV Wildcard', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'wildcard-ssl', validation: 'DV', wildcard: true,
    ...price(201.705, 791, 'DV_WC'),
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'GeoTrust DV wildcard — unlimited subdomains at a great price.',
    description: 'GeoTrust Flex Wildcard secures your primary domain plus unlimited subdomains, backed by the trusted GeoTrust brand.',
    features: [...F_WILDCARD, 'Instant DV issuance', '256-bit encryption'],
  }),
  mk({
    id: 'p-geotrust-tb-ov', slug: 'geotrust-truebusiness-id-ov',
    name: 'GeoTrust TrueBusinessID (OV)', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'ov-ssl', validation: 'OV',
    ...price(3, 100, 'OV'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Reliable business-grade OV SSL from GeoTrust.',
    description: 'GeoTrust TrueBusinessID includes full organisation validation, the GeoTrust site seal, and ₹12.5L warranty. Great mid-tier choice for company websites.',
    features: [...F_OV, 'GeoTrust site seal', '₹12.5L warranty'],
  }),
  mk({
    id: 'p-geotrust-tb-ov-mdc', slug: 'geotrust-truebusiness-id-ov-multi-domain',
    name: 'GeoTrust TrueBusinessID OV Multi-Domain', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'multi-domain-ssl', validation: 'OV', multiDomain: true,
    ...price(62.56, 272, 'OV_MD'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'GeoTrust OV multi-domain — verified business across all your SANs.',
    description: 'GeoTrust TrueBusinessID Multi-Domain secures up to 250 domains under a single verified organisation identity.',
    features: [...F_MULTI, ...F_OV, 'GeoTrust site seal'],
  }),
  mk({
    id: 'p-geotrust-tb-ov-wc', slug: 'geotrust-truebusiness-id-ov-wildcard',
    name: 'GeoTrust TrueBusinessID OV Wildcard', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'wildcard-ssl', validation: 'OV', wildcard: true,
    ...price(244.72, 1064, 'OV_WC'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'GeoTrust business-verified wildcard SSL.',
    description: 'Combines the trust of OV validation with unlimited subdomain protection. Great for enterprise SaaS on GeoTrust roots.',
    features: [...F_WILDCARD, ...F_OV, 'GeoTrust site seal'],
  }),
  mk({
    id: 'p-geotrust-tb-ev', slug: 'geotrust-truebusiness-id-ev',
    name: 'GeoTrust TrueBusinessID EV', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'ev-ssl', validation: 'EV',
    ...price(6.9, 230, 'EV'),
    warranty: '₹15,00,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'Extended validation SSL from GeoTrust — maximum browser trust.',
    description: 'GeoTrust TrueBusinessID EV includes the strictest identity verification and unlocks the highest visual trust indicators across all major browsers.',
    features: [...F_EV, 'GeoTrust site seal', '₹15L warranty'],
  }),
  mk({
    id: 'p-geotrust-tb-ev-mdc', slug: 'geotrust-truebusiness-id-ev-multi-domain',
    name: 'GeoTrust TrueBusinessID EV Multi-Domain', brandSlug: 'geotrust', brandName: 'GeoTrust',
    categorySlug: 'multi-domain-ssl', validation: 'EV', multiDomain: true,
    ...price(123.442, 310, 'EV_MD'),
    warranty: '₹15,00,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'GeoTrust EV multi-domain — enterprise trust at scale.',
    description: 'Extended validation SSL across up to 250 domains. Perfect for fintech and ecommerce enterprises consolidating trust.',
    features: [...F_MULTI, ...F_EV, 'GeoTrust site seal'],
  }),

  // ============== THAWTE ==============
  mk({
    id: 'p-thawte-ssl123-dv', slug: 'thawte-ssl123-dv',
    name: 'Thawte SSL123 DV', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'dv-ssl', validation: 'DV',
    ...price(0, 25, 'DV'), // promo — priced via MSRP fallback
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'Entry-level DV SSL from Thawte — enterprise brand, tiny price.',
    description: 'Thawte SSL123 is one of the world\u2019s most affordable DV certificates from a globally recognised brand. Ideal for personal, portfolio, and small business sites.',
    features: ['Instant DV issuance', '256-bit encryption', 'Thawte trust seal', ...F_STANDARD],
  }),
  mk({
    id: 'p-thawte-ssl123-dv-mdc', slug: 'thawte-ssl123-dv-multi-domain',
    name: 'Thawte SSL123 DV Multi-Domain', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'multi-domain-ssl', validation: 'DV', multiDomain: true,
    ...price(11.69, 167, 'DV_MD'),
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'Thawte DV SSL for multiple domains under one certificate.',
    description: 'Consolidate up to 250 domains into a single fast-issuance DV certificate from Thawte.',
    features: [...F_MULTI, 'Instant DV validation', 'Thawte trust seal'],
  }),
  mk({
    id: 'p-thawte-ssl123-dv-wc', slug: 'thawte-ssl123-dv-wildcard',
    name: 'Thawte SSL123 DV Wildcard', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'wildcard-ssl', validation: 'DV', wildcard: true,
    ...price(47.46, 791, 'DV_WC'),
    warranty: '₹5,00,000', issuance: '5 minutes', encryption: '256-bit',
    shortDescription: 'Thawte DV wildcard — unlimited subdomains, trusted brand.',
    description: 'Thawte SSL123 Wildcard delivers unlimited subdomain protection with the trust of a globally recognised CA.',
    features: [...F_WILDCARD, 'Instant DV issuance', 'Thawte trust seal'],
  }),
  mk({
    id: 'p-thawte-webserver-ov', slug: 'thawte-ssl-webserver-ov',
    name: 'Thawte SSL Webserver (OV)', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'ov-ssl', validation: 'OV',
    ...price(3, 100, 'OV'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Trusted OV SSL from Thawte for professional business sites.',
    description: 'Thawte SSL Webserver delivers business identity assurance, strong encryption, and the recognisable Thawte trust seal.',
    features: [...F_OV, 'Thawte trust seal', '₹12.5L warranty'],
  }),
  mk({
    id: 'p-thawte-webserver-ov-mdc', slug: 'thawte-ssl-webserver-ov-multi-domain',
    name: 'Thawte SSL Webserver OV Multi-Domain', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'multi-domain-ssl', validation: 'OV', multiDomain: true,
    ...price(65.28, 272, 'OV_MD'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Thawte OV SSL for multiple domains — enterprise identity.',
    description: 'Verified business identity across up to 250 domains with the enterprise-grade Thawte brand.',
    features: [...F_MULTI, ...F_OV, 'Thawte trust seal'],
  }),
  mk({
    id: 'p-thawte-webserver-ov-wc', slug: 'thawte-ssl-webserver-ov-wildcard',
    name: 'Thawte SSL Webserver OV Wildcard', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'wildcard-ssl', validation: 'OV', wildcard: true,
    ...price(244.72, 1064, 'OV_WC'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'Thawte business-verified wildcard — unlimited subdomains.',
    description: 'The enterprise wildcard from Thawte. Business validation plus unlimited subdomains for SaaS at scale.',
    features: [...F_WILDCARD, ...F_OV, 'Thawte trust seal'],
  }),
  mk({
    id: 'p-thawte-webserver-ev', slug: 'thawte-ssl-webserver-ev',
    name: 'Thawte SSL Webserver EV', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'ev-ssl', validation: 'EV',
    ...price(0, 230, 'EV'),
    warranty: '₹15,00,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'Thawte EV SSL — highest browser trust from a global CA.',
    description: 'Thawte SSL Webserver EV brings extended validation, the Thawte site seal and ₹15L warranty. Recommended for high-trust checkout and finance flows.',
    features: [...F_EV, 'Thawte trust seal', '₹15L warranty'],
  }),
  mk({
    id: 'p-thawte-webserver-ev-mdc', slug: 'thawte-ssl-webserver-ev-multi-domain',
    name: 'Thawte SSL Webserver EV Multi-Domain', brandSlug: 'thawte', brandName: 'Thawte',
    categorySlug: 'multi-domain-ssl', validation: 'EV', multiDomain: true,
    ...price(145.7, 310, 'EV_MD'),
    warranty: '₹15,00,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'Thawte EV multi-domain — enterprise-grade EV across many domains.',
    description: 'Extended validation for enterprises with many domains. Single expiry, unified management, maximum trust.',
    features: [...F_MULTI, ...F_EV, 'Thawte trust seal'],
  }),

  // ============== DIGICERT ==============
  mk({
    id: 'p-digicert-flex-ov', slug: 'digicert-secure-site-flex-ov',
    name: 'DigiCert Secure Site Flex (OV)', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'ov-ssl', validation: 'OV',
    ...price(84, 120, 'OV'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'DigiCert Secure Site Flex — premium OV SSL for growing companies.',
    description: 'Secure Site Flex delivers DigiCert\u2019s premium OV validation with fast issuance, CertCentral console access and the industry-leading DigiCert Smart Seal.',
    features: [...F_OV, 'DigiCert Smart Seal', 'CertCentral console', 'Priority support'],
  }),
  mk({
    id: 'p-digicert-flex-ov-mdc', slug: 'digicert-secure-site-flex-ov-multi-domain',
    name: 'DigiCert Secure Site Flex OV Multi-Domain', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'multi-domain-ssl', validation: 'OV', multiDomain: true,
    ...price(352.8, 504, 'OV_MD'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit', featured: true,
    shortDescription: 'DigiCert OV multi-domain SSL — verified business, up to 250 SANs.',
    description: 'Consolidate SSL across your business with DigiCert\u2019s premium OV multi-domain. Unified expiry, priority validation, DigiCert Smart Seal.',
    features: [...F_MULTI, ...F_OV, 'DigiCert Smart Seal', 'CertCentral console'],
  }),
  mk({
    id: 'p-digicert-flex-ov-wc', slug: 'digicert-secure-site-flex-ov-wildcard',
    name: 'DigiCert Secure Site Flex OV Wildcard', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'wildcard-ssl', validation: 'OV', wildcard: true,
    ...price(1990.8, 2844, 'OV_WC'),
    warranty: '₹12,50,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'DigiCert OV wildcard SSL — verified business, unlimited subdomains.',
    description: 'Premium OV wildcard from DigiCert. Unlimited subdomains plus verified organisation identity. Ideal for large-scale SaaS.',
    features: [...F_WILDCARD, ...F_OV, 'DigiCert Smart Seal', 'CertCentral console'],
  }),
  mk({
    id: 'p-digicert-flex-ev-mdc', slug: 'digicert-secure-site-flex-ev-multi-domain',
    name: 'DigiCert Secure Site Flex EV Multi-Domain', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'multi-domain-ssl', validation: 'EV', multiDomain: true,
    ...price(966, 1380, 'EV_MD'),
    warranty: '₹1,25,00,000', issuance: '3-5 business days', encryption: '256-bit',
    shortDescription: 'DigiCert EV multi-domain — highest trust across up to 250 domains.',
    description: 'Extended validation EV across every domain in your business. Ideal for fintech, banking and premium ecommerce brands.',
    features: [...F_MULTI, ...F_EV, 'DigiCert Smart Seal', '₹1.25 Cr warranty'],
  }),
  mk({
    id: 'p-digicert-pro-ov-mdc', slug: 'digicert-secure-site-pro-ov-multi-domain',
    name: 'DigiCert Secure Site Pro OV Multi-Domain', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'multi-domain-ssl', validation: 'OV', multiDomain: true,
    ...price(1083.6, 1548, 'OV_MD'),
    warranty: '₹1,25,00,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'DigiCert Pro OV multi-domain — enterprise-tier warranty & scanning.',
    description: 'Secure Site Pro tier adds daily malware scanning, vulnerability assessment and priority validation on top of premium OV.',
    features: [...F_MULTI, ...F_OV, 'Malware scanning', 'Vulnerability assessment', '₹1.25 Cr warranty'],
  }),
  mk({
    id: 'p-digicert-pro-ov-wc', slug: 'digicert-secure-site-pro-ov-wildcard',
    name: 'DigiCert Secure Site Pro OV Wildcard', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'wildcard-ssl', validation: 'OV', wildcard: true,
    ...price(4116, 5880, 'OV_WC'),
    warranty: '₹1,25,00,000', issuance: '1-3 business days', encryption: '256-bit',
    shortDescription: 'DigiCert Pro OV wildcard — enterprise wildcard with malware scan.',
    description: 'The most-featured OV wildcard on the market. DigiCert Pro adds malware scanning, vulnerability assessment and priority validation.',
    features: [...F_WILDCARD, ...F_OV, 'Malware scanning', 'Vulnerability assessment'],
  }),
  mk({
    id: 'p-digicert-pro-ev-mdc', slug: 'digicert-secure-site-pro-ev-multi-domain',
    name: 'DigiCert Secure Site Pro EV Multi-Domain', brandSlug: 'digicert', brandName: 'DigiCert',
    categorySlug: 'multi-domain-ssl', validation: 'EV', multiDomain: true,
    ...price(1570.8, 2244, 'EV_MD'),
    warranty: '₹20,80,00,000', issuance: '3-5 business days', encryption: '256-bit', featured: true,
    shortDescription: 'DigiCert Pro EV multi-domain — flagship EV for enterprises.',
    description: 'The flagship enterprise EV SSL. DigiCert\u2019s Pro tier with the industry\u2019s highest warranty (₹20 Cr), daily malware scanning, and unified EV trust across all your domains.',
    features: [...F_MULTI, ...F_EV, 'Malware scanning', 'Vulnerability assessment', '₹20 Cr warranty'],
  }),
]
