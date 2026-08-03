// Use cases the team enables on. The color slots are IBM Carbon data-viz ramp
// steps, ordered and validated for color-vision-deficiency separation on both
// the light (white) and dark (g100 #161616) surfaces — keep the order fixed
// and never assign these hues to anything that isn't a use case.
export const USE_CASES = [
  { id: 'vuln-mgmt',    label: 'Vulnerability Management', light: '#6929c4', dark: '#8a3ffc' },
  { id: 'secure-coder', label: 'Secure Coder',             light: '#1192e8', dark: '#1192e8' },
  { id: 'monitoring',   label: 'Monitoring',               light: '#b28600', dark: '#b28600' },
  { id: 'optimization', label: 'Optimization',             light: '#ee538b', dark: '#ee538b' },
  { id: 'other',        label: 'Other',                    light: '#198038', dark: '#198038' },
]

export const getUseCase = (id) => USE_CASES.find((u) => u.id === id) ?? USE_CASES[USE_CASES.length - 1]

export const getUseCaseColor = (id, theme) => {
  const uc = getUseCase(id)
  return theme === 'g100' ? uc.dark : uc.light
}

// color scale keyed by use-case label, for Carbon charts options.color.scale
export const getUseCaseColorScale = (theme) =>
  Object.fromEntries(USE_CASES.map((u) => [u.label, theme === 'g100' ? u.dark : u.light]))

export const DEAL_STAGES = [
  'Prospecting',
  'Qualification',
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost',
]

export const OPEN_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']

export const STAGE_TAG_TYPE = {
  'Prospecting': 'cool-gray',
  'Qualification': 'cool-gray',
  'Proposal': 'blue',
  'Negotiation': 'blue',
  'Closed Won': 'green',
  'Closed Lost': 'gray',
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdCompact = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2,
})

export const fmtUSD = (n) => usd.format(n)
export const fmtUSDCompact = (n) => usdCompact.format(n)

export const fmtPct = (ratio) => `${Math.round(ratio * 100)}%`

export const fmtDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

// Who to ask about a record — the latest edit stamp wins over the add stamp.
// Returns null for records created before the audit trail existed.
export const authorNote = (r) =>
  r.updatedBy ? `edited by ${r.updatedBy}` : r.createdBy ? `added by ${r.createdBy}` : null

// Local-date ISO (YYYY-MM-DD). Not toISOString(): that is UTC and would flip
// the date near midnight, making a session count as delivered a day early/late.
export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// "Reset all data" administration key. Only this SHA-256 hash ships in the
// bundle, so the key itself is not readable in the page source. To change the
// key, run in any browser console and paste the output here:
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('new-key')).then(
//     (b) => console.log([...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')))
export const ADMIN_KEY_HASH = '69308d325e093f046c5884277efcecc3d3dafc14c5828a1941a6fb24271f814c'

export const sha256Hex = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// "Request a session" opens the seller's mail client pre-filled. Set the
// enablement team's distribution list here before sharing the dashboard;
// while empty, the To field is simply left blank.
export const SESSION_REQUEST_EMAIL = ''

export const sessionRequestMailto = (useCaseLabel) => {
  const subject = 'Enablement session request'
  const body = [
    'Hi team,',
    '',
    'I’d like to request an enablement session.',
    '',
    `Use case: ${useCaseLabel || ''}`,
    'Customer / audience: ',
    'Preferred timing: ',
  ].join('\n')
  return `mailto:${SESSION_REQUEST_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
