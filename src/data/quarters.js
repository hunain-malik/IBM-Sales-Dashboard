// IBM's fiscal year matches the calendar year, so fiscal quarters are
// calendar quarters: Q1 = Jan–Mar, Q2 = Apr–Jun, Q3 = Jul–Sep, Q4 = Oct–Dec.
export const quarterStart = (d) => new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1)
export const nextQuarter = (q) => new Date(q.getFullYear(), q.getMonth() + 3, 1)
export const prevQuarter = (q) => quarterStart(new Date(q.getFullYear(), q.getMonth() - 3, 1))
export const quarterLabel = (q) => `Q${Math.floor(q.getMonth() / 3) + 1} ${q.getFullYear()}`
