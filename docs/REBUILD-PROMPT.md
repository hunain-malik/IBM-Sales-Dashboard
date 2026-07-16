# Build prompt — Enablement Impact Dashboard

Copy everything below the line into the AI builder.

---

Build a single-page web application called the **Enablement Impact Dashboard**. Its purpose: track the enablement sessions our team delivers and the customer pipeline/revenue that follows them, to show sales and executives — with numbers, not narration — that the team drives revenue, and where to invest next. Follow this specification exactly; every detail here is deliberate.

## Tech stack

- React + Vite. UI components from IBM Carbon Design System (`@carbon/react`), themes `white` (light) and `g100` (dark) with a header toggle (moon/sun icon). Do NOT use a charting library — all charts are hand-rolled inline SVG (specs below).
- Hash-based routing (works on static hosting): `/` Command Center (landing), `/enablements`, `/pipeline`, `/onepager`.
- v1 persistence: browser `localStorage`, single JSON document, versioned key (e.g. `enablement-dashboard-data-v2`). Seed demo data on first load (dataset below). Header has a "reset demo data" action (confirm dialog) and the theme toggle.

## Non-negotiable architecture rule: total reactivity

There is ONE store (React context) holding `{ enablements[], deals[] }`. Every number, chart, table row, sort position, tag, verdict sentence, and recommendation on every page is **derived at render time** from that store — nothing is cached or duplicated. Adding, editing (including changing dates), or deleting any record must immediately propagate everywhere: KPIs recompute, win rates recompute, tables re-sort chronologically into the correct position, chart bars/lanes/curves update, coverage verdicts flip, the one-pager reflects it, and deleting reverts everything exactly.

## Data model

Enablement session: `{ id, title, useCase, date (ISO yyyy-mm-dd), presenter, attendees (number), hours (number, prep+delivery) }`
Deal: `{ id, customer, useCase, value (USD number), date (open date, ISO), stage, owner, closeDate? (ISO, only when stage is closed) }`
Stages: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost. Open = the first four.

Use cases are a FIXED list of five; each owns a color pair (chosen from IBM Carbon data-viz ramps and validated for color-vision-deficiency separation and 3:1 surface contrast in both themes — keep the hues exactly, never reassign them to anything that isn't a use case, and always pair color with a text label, never color alone):

| id | label | light theme hex | dark (g100) hex |
|---|---|---|---|
| vuln-mgmt | Vulnerability Management | #6929c4 | #8a3ffc |
| secure-coder | Secure Coder | #1192e8 | #1192e8 |
| monitoring | Monitoring | #b28600 | #b28600 |
| optimization | Optimization | #ee538b | #ee538b |
| other | Other | #198038 | #198038 |

Accent (non-use-case) blue: #0f62fe light / #4589ff dark. Context gray: #a8a8a8 light / #6f6f6f dark. Neutral not-influenced gray: #8d8d8d.

## Attribution rule (the core logic)

A deal is **enablement-influenced** when at least one session on the SAME use case was delivered ON OR BEFORE the deal's open date. `matched` = all such sessions sorted ascending; "first matching session" = the earliest. Deals with no prior matching session are explicitly NOT counted (and are shown as such, not hidden).

Fiscal note: IBM's fiscal year = calendar year, so fiscal quarters are calendar quarters (Q1 = Jan–Mar…). Quarter labels render as "Q3 2026".

## Derived metrics

- `wonRevenue` = sum of influenced Closed Won values; `pipelineRevenue` = sum of influenced open-stage values.
- `valuePerHour` = (wonRevenue + pipelineRevenue) / total session hours; null if hours total 0.
- Comparison (influenced vs not-influenced groups): win rate = won/(won+lost); average deal size = mean value across the group; sales cycle = mean days open→close over closed deals having closeDate. Any metric with insufficient data is null and displays "not enough data".
- Coverage per use case: demand share = use-case deal value / all deal value; coverage share = use-case session hours / all hours (fall back to session-count share if no hours anywhere). Gap = demand − coverage.

## Insights engine (adaptive narrative — never hardcode a claim)

Compute per-metric outcomes with epsilons (win rate ±2 pts, size ±5% of baseline, cycle ±2 days) → better/worse/even/unknown. Tone:
- **strong** (wins, no losses): "Influenced deals outperform: a higher win rate (75% vs 0%), 3.3× larger deals ($X vs $Y) and closing 27 days faster (50 days vs 77 days)." (only the winning clauses, joined naturally)
- **mixed**: "Mixed results: influenced deals show …, but …" (name both sides)
- **weak** (losses, no wins): "Influenced deals aren't outperforming yet: …"
- **even**: if some metrics unknown, say what's measurable looks similar and that closing more deals will enable the rest — never overstate.
- **early**: influenced deals exist but no closed deals → say so.
- **none**: empty states (no data / no deals / no sessions / no influence) each get a specific plain sentence.
- Small-sample caveat when influenced n < 4 or rest n < 2: "Small sample (X influenced vs Y not) — read as an early signal, not a proven effect."

Recommended actions (generated, in order): invest where gap ≥ +5 pts ("Add enablement capacity on X — customer demand outruns coverage (X: 39% of demand vs 19% of our effort)"); use cases with deals but zero sessions ("Customers are active on X with no enablement delivered yet"); if neither, "coverage is balanced — maintain cadence"; on weak/mixed tone add "Review the influenced deals that stalled or lost — check whether session timing, content, or audience needs adjusting before scaling up"; data hygiene asks when hours are unrecorded or closed deals lack close dates. Short tone headings per tone for the one-pager ("Influenced deals perform better" / "…: mixed results" / "…: no edge yet" / etc.).

## Copy rules

Numbers do the talking. NO explanatory captions, no self-justifying prose, no marketing filler anywhere in the app. Titles are plain and informational with Both Words Capitalized. KPI sub-lines carry only data ("82% of all tracked deals"), never definitions. Definitions live ONLY on the printable one-pager footer. YTD disclaimer appears in exactly three places (below).

## Page 1 — Command Center (landing, `/`)

Header row: title "Enablement Impact", one line under it: "All figures year to date, from the start of FY{currentYear}." Right side: tertiary button "Executive one-pager" → `/onepager`.

Sections, full-width stacked cards in THIS order (no side-by-side panels; nothing may need a horizontal scrollbar at ≥1100px):

1. **KPI row** (5 tiles): "Deals driven by enablement" (`9 of 11`, sub "82% of all tracked deals"); "Influenced revenue (closed won)" ($1.38M compact); "Influenced open pipeline" ($1.31M); "Sessions delivered" (9, sub "172 attendees enabled"); "Influenced value per team hour" ($50.75K, sub "53 enablement hours invested"; if no hours: "—" with sub "Add hours to sessions to compute ROI"). Large light-weight values (~42px).
2. **"Deal performance: influenced vs. not influenced"** — legend "Enablement-influenced (n=9)" (accent blue swatch) vs "Not influenced (n=2)" (gray). Three stat rows (Win rate, Average deal size, Average sales cycle): fixed 16rem label column, flexible bar column, fixed 13rem delta column so ALL bars start at the same x across rows. Two horizontal bars per row (influenced accent, rest gray) scaled to the pair max, values direct-labeled after each bar. Delta column states BOTH directions ("+75 pts" / "3.3× larger" / "27 days faster" in bold link-blue when favorable; "12 days slower" / "2.1× smaller" in calm secondary ink when adverse — never hide bad news). Show the small-sample caveat line when applicable. Content max-width 72rem.
3. **"Influenced pipeline opened by month"** — hand-rolled SVG bar chart, ONE fiscal quarter at a time with chevron navigation (‹ Q3 2026 ›, right-aligned; back bounded by earliest data quarter, forward bounded by current quarter). Three month bands with separator gridlines, month labels centered under each band (first label includes year). One accent-blue bar per month, direct-labeled with compact USD above it. Months not yet begun: NO bar, italic "Coming soon" instead of $0. The in-progress month gets a link-blue bold "Current month" tag above its band and a bolded axis label. Past months with zero show "$0". Only render this card when influenced deals exist.
4. **"Customer demand vs. enablement coverage"** — legend: "Customer demand (share of deal value)" (accent) vs "Enablement coverage (share of team hours)" (gray). One row per use case with any activity, sorted by gap descending; same fixed-column alignment as section 2. Row label = use-case color chip + name, sub-line "3 deals · $1.18M · 2 sessions / 10h". Two bars (demand share %, coverage share %) direct-labeled. Verdict tag right column: gap ≥ +5 pts → blue tag "Invest here · +20 pts demand"; gap ≤ −5 → green "Well covered"; else gray "Balanced".
5. **"Influenced deals" table** — influenced deals only, sorted by OPEN DATE, most recent first. Columns exactly: Customer | Revenue | Use case | Stage | First matching session | Open date | Days from session to deal. Use case = color chip + label; Stage = Carbon tag (green Closed Won, gray Closed Lost, blue Proposal/Negotiation, cool-gray early stages); First matching session = session title with a small helper sub-line "delivered {Mon D, YYYY}" (disambiguates the session's delivery date from the deal's open date). Empty state when none: "No influenced deals yet" + explanation + link to Enablements.

## Page 2 — Enablement Sessions (`/enablements`)

Title "Enablement Sessions", sub-line "Click a day to log a session." "Add enablement" primary button top-right. Then, in order: (1) sessions TABLE (full width, sorted date desc; columns: Session (title + presenter sub-line) | Use case | Date | Attendees | Hours | edit + delete icon actions); (2) a full-width MONTH CALENDAR below it — 7-column grid, month navigation chevrons, today's number highlighted, sessions rendered as chips with a left border in their use-case color, use-case color legend underneath; clicking any day opens the add-modal pre-filled with that date.

Add/Edit session modal fields IN THIS ORDER (table column order must mirror form order): Session title*, Presenter (optional), Use case* (dropdown of the 5), Session date* (date picker), Attendees, Team hours invested (prep + delivery). Edit reuses the same modal prefilled ("Edit enablement session" / "Save changes").

## Page 3 — Customer Pipeline (`/pipeline`)

Title "Customer Pipeline", "Add deal" button top-right. Deals TABLE: ALL deals, sorted open date desc; columns: Customer | Revenue | Use case | Open date | Stage | Owner | Enablement | actions (edit + delete). Enablement column: purple tag "Influenced" when attributed (hover title says how many sessions preceded it) else "—".

Add/Edit deal modal field order: Customer name*, Deal revenue (USD)*, Use case*, Deal open date*, Stage, Close date (this field APPEARS ONLY when stage is Closed Won/Closed Lost, and is cleared from the record if the stage returns to open), Deal owner (optional).

Below the table: **"Session-to-deal timeline"** card — the signature visualization, hand-rolled SVG:
- One fiscal quarter at a time, same chevron nav pattern (‹ Q3 2026 ›), bounded the same way. Month gridlines within the quarter, labels centered per band. Axis ends at the QUARTER END. Dashed link-blue "Today" vertical marker only when viewing the current quarter.
- One horizontal lane per use case with activity in the viewed quarter: lane header = color chip + name (its own band at the lane top); a subtle baseline (the "session line") lower in the lane. Plot area starts ~64px inset from the left so markers never collide with headers.
- Sessions = filled diamonds (use-case color) on the session line. Deals = dots above: filled in use-case color when influenced, hollow gray ring when NOT influenced (visibly excluded — this honesty is the point). Each deal labeled: customer name (bold 11px) + compact value with "· won"/"· lost" suffix for closed deals. When two labels would collide (<116px apart), drop the second BELOW its dot (two-track placement).
- Influence curves (1.5px, use-case color, 45% opacity, vertical-tangent cubic bezier) connect each influenced deal DOWN to the session that preceded it — the earliest matched session WITHIN the viewed quarter if one exists. If the only matching sessions are from an EARLIER quarter (deal landed this quarter, enablement last quarter), draw the curve DASHED from the left plot edge, with a small filled left-pointing triangle at the boundary and a tiny helper label "from Q2" (or "from earlier" if multiple quarters); hovering it lists the prior-quarter session names and dates.
- Legend row above: diamond = "Enablement session"; filled dot = "Influenced deal (opened after a session)"; hollow dot = "Deal with no prior enablement — not counted"; dashed-line item "Influence carried from an earlier quarter" shown only when present.
- Tooltips: custom instant HTML tooltips (NOT native SVG title — too slow): oversized invisible hit circles (r≈16–18) on every diamond/dot/carried marker; tooltip follows cursor, flips below the cursor near the container top and left of it near the right edge; content = full detail (session: title/date/presenter/attendees/hours; deal: customer, full USD, stage, open date, and either the linking session or the carried-from explanation, or "Not counted — no X session before this deal").
- Empty quarter: keep the nav visible with "No sessions or deals in Q3 2026."

## Page 4 — Executive Summary (`/onepager`)

A print-optimized white sheet (max-width 56rem, centered, always light-themed regardless of app theme) with a no-print toolbar: "Back to dashboard" ghost button and a primary "Print / save as PDF" button that calls `window.print()`.

Sheet content in order:
1. Header: eyebrow "IBM · ENABLEMENT IMPACT", title "Executive Summary"; right side: "FY{year} year to date · {Month D, YYYY}".
2. KPI band — SAME ORDER as the dashboard: Deals driven by enablement (9 of 11) | Influenced revenue (closed won) | Influenced open pipeline | Influenced value per team hour (with "(53h invested)" in the label).
3. Two columns: LEFT — section headed by the adaptive tone heading (e.g. "Influenced deals perform better"), the small-sample caveat in italics when applicable, then a compact 3-row table (Win rate / Average deal size / Average sales cycle × Influenced (n=9) / Not influenced (n=2)), influenced values in bold link-blue. RIGHT — "Demand vs. coverage by use case": table of Use case | Demand share | Coverage share.
4. Full-width callout (light blue background, blue left border): bold "Recommended actions" heading with the generated asks as plain flush-left lines (no bullets, no indent — aligned exactly with the heading).
5. "Top enablement-influenced deals": top 5 BY VALUE. Fixed column widths 20/13/27/16/24% — Customer | Revenue (left-aligned under its header) | Use case | Stage (tag) | First matching session (title + small "delivered {date}" sub-line). Generous 1.25rem column gutters so nothing crowds.
6. Footer (small, gray): "Attribution method: a deal counts as enablement-influenced when the customer's use case matches at least one session our team delivered on or before the deal's open date. All figures are year to date from the start of FY{year}, as entered by {date}."

Print CSS: hide app header and toolbar; white background, zero sheet padding, exact colors (`print-color-adjust: exact`); table rows, KPI band, and callout never split across page breaks; headings keep their sections; page margin 1.25cm. Must fit one page with the demo data.

## App shell

Carbon UI Shell header, always g100-dark: text brand "IBM  Enablement Impact" (plain text — do NOT recreate the 8-bar logo without brand approval), nav tabs "Command Center", "Enablements", "Pipeline" (active tab underlined), global actions: reset-demo-data (confirm first) and theme toggle. Content area max-width 88rem, centered. In dark mode the page background and body must both be the g100 background (no white strip below the content).

## Seed demo data (today assumed mid-July 2026)

Sessions (id, title, useCase, date, presenter, attendees, hours): e1 "Vulnerability Management 101 Workshop" vuln-mgmt 2026-02-10 "A. Chen" 18 6; e2 "Secure Coder Hands-on Lab" secure-coder 2026-02-24 "M. Rodriguez" 24 8; e3 "Monitoring Deep Dive" monitoring 2026-03-05 "S. Patel" 15 5; e4 "Advanced Vulnerability Management" vuln-mgmt 2026-03-18 "A. Chen" 12 4; e5 "Optimization Cost-Savings Workshop" optimization 2026-04-02 "J. Kim" 20 6; e6 "Secure Coder Certification Bootcamp" secure-coder 2026-04-21 "M. Rodriguez" 30 12; e7 "Observability Clinic" monitoring 2026-05-12 "S. Patel" 17 4; e8 "FinOps Optimization Enablement" optimization 2026-06-09 "J. Kim" 22 6; e9 "Secure Coder Office Hours" secure-coder 2026-07-08 "M. Rodriguez" 14 2.

Deals (customer, useCase, value, open date, stage, owner, closeDate): Acme Financial vuln-mgmt 420000 2026-03-02 Negotiation "T. Nguyen"; Globex Retail secure-coder 250000 2026-03-14 "Closed Won" "L. Ortiz" 2026-05-02; Initech Manufacturing monitoring 180000 2026-04-08 Proposal "T. Nguyen"; Umbrella Health vuln-mgmt 610000 2026-04-27 "Closed Won" "R. Walker" 2026-06-20; Stark Industries optimization 340000 2026-05-06 Negotiation "L. Ortiz"; Wayne Enterprises secure-coder 520000 2026-05-22 "Closed Won" "R. Walker" 2026-07-08; Soylent Foods monitoring 95000 2026-06-15 Qualification "T. Nguyen"; Hooli Cloud optimization 275000 2026-07-01 Proposal "L. Ortiz"; Pied Piper other 60000 2026-05-19 Prospecting "R. Walker" (NOT influenced — no Other sessions); Vandelay Imports secure-coder 130000 2026-02-12 "Closed Lost" "T. Nguyen" 2026-04-30 (NOT influenced — opened before the first Secure Coder session); Cyberdyne Systems vuln-mgmt 150000 2026-03-25 "Closed Lost" "R. Walker" 2026-05-15.

Expected demo readout (use as acceptance checks): 9 of 11 deals influenced (82%); $1.38M influenced won; $1.31M influenced open pipeline; 172 attendees; 53 hours; $50.75K/hour; win rate 75% vs 0% (+75 pts); avg size $315.56K vs $95K (3.3× larger); cycle 50 vs 77 days (27 days faster); Vulnerability Management flagged "Invest here · +20 pts demand"; adding any "Other" session dated before May 19 must automatically flip Pied Piper to influenced everywhere.

## Formatting

USD full: `$610,000`; USD compact: `$1.38M` / `$315.56K` (Intl compact, ≤2 decimals); dates: `Apr 27, 2026`; percentages rounded to whole numbers. Sorting is always applied at render time so edited dates re-slot rows chronologically.

## Acceptance tests (verify before calling it done)

1. Add a session on a use case that has deals but no sessions → those deals flip to Influenced everywhere (KPIs, tables, timeline, coverage, one-pager) instantly.
2. Edit a deal's open date → it re-sorts into the correct chronological position in BOTH deal tables and moves on the timeline/monthly chart.
3. Edit a deal to Closed Won with a close date → won-revenue KPI and win rate update.
4. Edit a session's hours → total hours and $-per-hour KPI update.
5. Delete the records → every number reverts exactly.
6. With an adverse dataset (influenced deals losing more/smaller/slower), the verdict heading and recommendations must state it honestly — never render a hardcoded positive claim.
7. No horizontal scrollbars inside cards at 1100px+; all comparison/coverage bars start at the same x; tooltips appear instantly on hover and never clip.
