// Demo data so the dashboard tells its story on first load.
// Replace or clear via the reset control in the header.
// `hours` is the team effort invested in a session (prep + delivery) and
// feeds the value-per-enablement-hour and coverage-gap views.
export const seedEnablements = [
  { id: 'e1', title: 'Vulnerability Management 101 Workshop', useCase: 'vuln-mgmt',    date: '2026-02-10', presenter: 'A. Chen',      attendees: 18, hours: 6 },
  { id: 'e2', title: 'Secure Coder Hands-on Lab',             useCase: 'secure-coder', date: '2026-02-24', presenter: 'M. Rodriguez', attendees: 24, hours: 8 },
  { id: 'e3', title: 'Monitoring Deep Dive',                  useCase: 'monitoring',   date: '2026-03-05', presenter: 'S. Patel',     attendees: 15, hours: 5 },
  { id: 'e4', title: 'Advanced Vulnerability Management',     useCase: 'vuln-mgmt',    date: '2026-03-18', presenter: 'A. Chen',      attendees: 12, hours: 4 },
  { id: 'e5', title: 'Optimization Cost-Savings Workshop',    useCase: 'optimization', date: '2026-04-02', presenter: 'J. Kim',       attendees: 20, hours: 6 },
  { id: 'e6', title: 'Secure Coder Certification Bootcamp',   useCase: 'secure-coder', date: '2026-04-21', presenter: 'M. Rodriguez', attendees: 30, hours: 12 },
  { id: 'e7', title: 'Observability Clinic',                  useCase: 'monitoring',   date: '2026-05-12', presenter: 'S. Patel',     attendees: 17, hours: 4 },
  { id: 'e8', title: 'FinOps Optimization Enablement',        useCase: 'optimization', date: '2026-06-09', presenter: 'J. Kim',       attendees: 22, hours: 6 },
  { id: 'e9', title: 'Secure Coder Office Hours',             useCase: 'secure-coder', date: '2026-07-08', presenter: 'M. Rodriguez', attendees: 14, hours: 2 },
]

// `closeDate` is set once a deal reaches Closed Won / Closed Lost and is used
// to compare sales-cycle length between influenced and non-influenced deals.
export const seedDeals = [
  { id: 'd1',  customer: 'Acme Financial',        useCase: 'vuln-mgmt',    value: 420000, date: '2026-03-02', stage: 'Negotiation',   owner: 'T. Nguyen' },
  { id: 'd2',  customer: 'Globex Retail',         useCase: 'secure-coder', value: 250000, date: '2026-03-14', stage: 'Closed Won',    owner: 'L. Ortiz',  closeDate: '2026-05-02' },
  { id: 'd3',  customer: 'Initech Manufacturing', useCase: 'monitoring',   value: 180000, date: '2026-04-08', stage: 'Proposal',      owner: 'T. Nguyen' },
  { id: 'd4',  customer: 'Umbrella Health',       useCase: 'vuln-mgmt',    value: 610000, date: '2026-04-27', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-06-20' },
  { id: 'd5',  customer: 'Stark Industries',      useCase: 'optimization', value: 340000, date: '2026-05-06', stage: 'Negotiation',   owner: 'L. Ortiz' },
  { id: 'd6',  customer: 'Wayne Enterprises',     useCase: 'secure-coder', value: 520000, date: '2026-05-22', stage: 'Closed Won',    owner: 'R. Walker', closeDate: '2026-07-08' },
  { id: 'd7',  customer: 'Soylent Foods',         useCase: 'monitoring',   value: 95000,  date: '2026-06-15', stage: 'Qualification', owner: 'T. Nguyen' },
  { id: 'd8',  customer: 'Hooli Cloud',           useCase: 'optimization', value: 275000, date: '2026-07-01', stage: 'Proposal',      owner: 'L. Ortiz' },
  { id: 'd9',  customer: 'Pied Piper',            useCase: 'other',        value: 60000,  date: '2026-05-19', stage: 'Prospecting',   owner: 'R. Walker' },
  { id: 'd10', customer: 'Vandelay Imports',      useCase: 'secure-coder', value: 130000, date: '2026-02-12', stage: 'Closed Lost',   owner: 'T. Nguyen', closeDate: '2026-04-30' },
  { id: 'd11', customer: 'Cyberdyne Systems',     useCase: 'vuln-mgmt',    value: 150000, date: '2026-03-25', stage: 'Closed Lost',   owner: 'R. Walker', closeDate: '2026-05-15' },
]
