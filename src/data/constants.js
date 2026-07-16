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
