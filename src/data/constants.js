// The products the team enables on. Colors live at the PRODUCT level (three
// hues stay color-vision-deficiency-safe; a per-use-case palette could not),
// taken from the CVD-validated IBM Carbon data-viz ramp slots used since v1.
// Never assign these hues to anything that isn't a product.
export const PRODUCTS = [
  { id: 'concert-protect', label: 'Concert Protect', light: '#6929c4', dark: '#8a3ffc' },
  { id: 'instana',         label: 'Instana',         light: '#1192e8', dark: '#1192e8' },
  { id: 'turbonomic',      label: 'Turbonomic',      light: '#ee538b', dark: '#ee538b' },
]

const NO_PRODUCT_COLOR = '#8d8d8d' // records logged before the product field existed

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id) ?? null

export const getProductColor = (id, theme) => {
  const p = getProduct(id)
  if (!p) return NO_PRODUCT_COLOR
  return theme === 'g100' ? p.dark : p.light
}

// Each product carries its own fixed use-case catalog; 'custom' (free text on
// the record as customUseCase) covers anything the catalogs don't describe.
export const USE_CASES_BY_PRODUCT = {
  'concert-protect': [
    { id: 'cp-vuln-mgmt',        label: 'Vulnerability Management' },
    { id: 'cp-compliance',       label: 'Compliance' },
    { id: 'cp-cert-mgmt',        label: 'Certificate Management' },
    { id: 'cp-sca',              label: 'Software Composition Analysis' },
    { id: 'cp-app-resilience',   label: 'Application Resilience' },
  ],
  'instana': [
    { id: 'in-observability',    label: 'Full-Stack Observability' },
    { id: 'in-incident',         label: 'Incident Investigation' },
    { id: 'in-performance',      label: 'Performance Optimization' },
    { id: 'in-k8s-cost',         label: 'Kubernetes Cost Management' },
    { id: 'in-genai',            label: 'GenAI Observability' },
    { id: 'in-resilience',       label: 'Resilience & Compliance Automation' },
  ],
  'turbonomic': [
    { id: 'tu-cloud-cost',       label: 'Cloud Cost Optimization' },
    { id: 'tu-k8s',              label: 'Kubernetes Resource Optimization' },
    { id: 'tu-gpu',              label: 'GPU Optimization' },
    { id: 'tu-dc-modernization', label: 'Data Center Modernization' },
    { id: 'tu-cloud-migration',  label: 'Cloud Migration Planning' },
    { id: 'tu-vmware',           label: 'VMware Optimization' },
  ],
}

const ALL_CATALOG = Object.values(USE_CASES_BY_PRODUCT).flat()

// v1's flat use-case list, kept ONLY so records logged before the product
// dimension existed still display their original label
const LEGACY_USE_CASES = {
  'vuln-mgmt': 'Vulnerability Management',
  'secure-coder': 'Secure Coder',
  'monitoring': 'Monitoring',
  'optimization': 'Optimization',
  'other': 'Other',
}

// display label for any record's use case: catalog id, custom text, or legacy
export const getUseCaseLabel = (r) => {
  if (r.useCase === 'custom') return r.customUseCase || 'Custom'
  const hit = ALL_CATALOG.find((u) => u.id === r.useCase)
  if (hit) return hit.label
  return LEGACY_USE_CASES[r.useCase] ?? r.useCase ?? '—'
}

// what has to be equal for a session and a deal to match automatically:
// catalog use cases match by id (which encodes the product); custom ones
// match when the product AND the wording (case/space-insensitive) agree
export const matchKeyOf = (r) =>
  r.useCase === 'custom'
    ? `custom:${r.product ?? ''}:${(r.customUseCase ?? '').trim().toLowerCase()}`
    : r.useCase

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
