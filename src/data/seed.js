// Demo data so the dashboard tells its story on first load (standalone/dev
// mode only — the shared deployment starts from the server). Records carry
// the product dimension: product id + a use case from that product's catalog,
// or useCase 'custom' with the text in customUseCase.
// `hours` is the team effort invested in a session (prep + delivery).
export const seedEnablements = [
  { id: 'e1',  title: 'Concert Protect Vulnerability Deep Dive',      product: 'concert-protect', useCase: 'cp-vuln-mgmt',    date: '2026-02-10', presenter: 'T. Almeida',  attendees: 18, hours: 6 },
  { id: 'e2',  title: 'Instana Observability Workshop',               product: 'instana',         useCase: 'in-observability', date: '2026-02-24', presenter: 'P. Kowalska', attendees: 24, hours: 8 },
  { id: 'e3',  title: 'Turbonomic Cloud Cost Clinic',                 product: 'turbonomic',      useCase: 'tu-cloud-cost',    date: '2026-03-05', presenter: 'T. Almeida',  attendees: 15, hours: 5 },
  { id: 'e4',  title: 'Concert Protect Compliance Lab',               product: 'concert-protect', useCase: 'cp-compliance',    date: '2026-03-18', presenter: 'P. Kowalska', attendees: 12, hours: 4 },
  { id: 'e5',  title: 'Instana Incident Investigation Bootcamp',      product: 'instana',         useCase: 'in-incident',      date: '2026-04-02', presenter: 'P. Kowalska', attendees: 20, hours: 6 },
  { id: 'e6',  title: 'Turbonomic Kubernetes Optimization Workshop',  product: 'turbonomic',      useCase: 'tu-k8s',           date: '2026-04-21', presenter: 'J. Kim',      attendees: 30, hours: 12 },
  { id: 'e7',  title: 'Instana GenAI Observability Briefing',         product: 'instana',         useCase: 'in-genai',         date: '2026-05-12', presenter: 'P. Kowalska', attendees: 17, hours: 4 },
  { id: 'e8',  title: 'Concert Protect SCA Hands-on',                 product: 'concert-protect', useCase: 'cp-sca',           date: '2026-06-09', presenter: 'T. Almeida',  attendees: 22, hours: 6 },
  // a custom use case: nothing in the Instana catalog says "mainframe"
  { id: 'e9',  title: 'Mainframe Observability Roundtable',           product: 'instana',         useCase: 'custom', customUseCase: 'Mainframe observability', date: '2026-07-08', presenter: 'P. Kowalska', attendees: 14, hours: 2 },
  // Scheduled sessions (future-dated): shown in "Upcoming sessions" and on
  // the calendar, excluded from every delivered total until their date passes.
  { id: 'e10', title: 'Turbonomic GPU Optimization Briefing',         product: 'turbonomic',      useCase: 'tu-gpu',           date: '2026-08-12', presenter: 'J. Kim',      attendees: 0, hours: 3 },
  { id: 'e11', title: 'Concert Protect Certificate Management Demo',  product: 'concert-protect', useCase: 'cp-cert-mgmt',     date: '2026-08-27', presenter: 'T. Almeida',  attendees: 0, hours: 2 },
]

// `closeDate` is set once a deal reaches Closed Won / Closed Lost and is used
// to compare sales-cycle length between touched and untouched deals.
export const seedDeals = [
  { id: 'd1',  customer: 'Acme Financial',        product: 'concert-protect', useCase: 'cp-vuln-mgmt',    value: 420000, date: '2026-03-02', stage: 'Negotiation',   owner: 'T. Nguyen' },
  { id: 'd2',  customer: 'Globex Retail',         product: 'instana',         useCase: 'in-observability', value: 250000, date: '2026-03-14', stage: 'Closed Won',    owner: 'L. Ortiz',  closeDate: '2026-05-02' },
  { id: 'd3',  customer: 'Initech Manufacturing', product: 'turbonomic',      useCase: 'tu-cloud-cost',    value: 180000, date: '2026-04-08', stage: 'Proposal',      owner: 'T. Nguyen' },
  { id: 'd4',  customer: 'Umbrella Health',       product: 'concert-protect', useCase: 'cp-compliance',    value: 610000, date: '2026-04-27', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-06-20' },
  { id: 'd5',  customer: 'Stark Industries',      product: 'instana',         useCase: 'in-incident',      value: 340000, date: '2026-05-06', stage: 'Negotiation',   owner: 'L. Ortiz' },
  { id: 'd6',  customer: 'Wayne Enterprises',     product: 'turbonomic',      useCase: 'tu-k8s',           value: 520000, date: '2026-05-22', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-07-08' },
  { id: 'd7',  customer: 'Soylent Foods',         product: 'instana',         useCase: 'in-genai',         value: 95000,  date: '2026-06-15', stage: 'Qualification', owner: 'T. Nguyen' },
  { id: 'd8',  customer: 'Hooli Cloud',           product: 'concert-protect', useCase: 'cp-sca',           value: 275000, date: '2026-07-01', stage: 'Proposal',      owner: 'L. Ortiz' },
  // NOT touched: no VMware Optimization session has been delivered
  { id: 'd9',  customer: 'Pied Piper',            product: 'turbonomic',      useCase: 'tu-vmware',        value: 60000,  date: '2026-05-19', stage: 'Prospecting',   owner: 'R. Walker' },
  // NOT touched: opened before the first Instana observability session
  { id: 'd10', customer: 'Vandelay Imports',      product: 'instana',         useCase: 'in-observability', value: 130000, date: '2026-02-12', stage: 'Closed Lost',   owner: 'T. Nguyen', closeDate: '2026-04-30' },
  // touched AND lost — shown honestly
  { id: 'd11', customer: 'Cyberdyne Systems',     product: 'concert-protect', useCase: 'cp-vuln-mgmt',    value: 150000, date: '2026-03-25', stage: 'Closed Lost',   owner: 'R. Walker', closeDate: '2026-05-15' },
  // touched via CUSTOM use-case matching (same product + same wording as e9)
  { id: 'd12', customer: 'Pier 57 Logistics',     product: 'instana',         useCase: 'custom', customUseCase: 'Mainframe observability', value: 90000, date: '2026-07-20', stage: 'Qualification', owner: 'L. Ortiz' },
]
