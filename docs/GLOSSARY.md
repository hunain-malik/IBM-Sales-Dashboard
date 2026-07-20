# GTM Pipeline View — Glossary & Methodology

This page defines every term and calculation used in the GTM Pipeline View, so anyone
reading the dashboard can see exactly how each number is produced.

> **The most important thing first:** "GTM-touched" is an **association by timing and
> topic, not an attribution of credit.** It means an enablement session on the same use
> case happened before the deal opened — nothing more. Sales owns and closes the deals;
> this view exists to show where enablement activity and pipeline activity coincide, so
> we can plan enablement investment together.

## Terms

**GTM-touched deal** — A deal where at least one enablement session on the **same use
case** was delivered **on or before the deal's open date**. Deals with no such prior
session are explicitly *not counted* and are shown as excluded (hollow markers on the
timeline), never hidden.

**Use case** — One of five fixed categories both sessions and deals are tagged with:
Vulnerability Management, Secure Coder, Monitoring, Optimization, Other. Matching happens
only within the same use case.

**First matching session** — The *earliest* session on the deal's use case delivered on or
before the deal's open date. Shown with its delivery date ("delivered Feb 10, 2026").

**Open date** — The date the deal was opened, as entered by the deal owner. This is the
date used for the timing match.

**Close date** — Entered when a deal reaches Closed Won or Closed Lost. Used only for
sales-cycle length.

**Days from session to deal** — Deal open date minus the first matching session's delivery
date, in days.

**Touchpoint carried from an earlier quarter** — In quarter-scoped views, a deal that
opened in the displayed quarter whose matching session happened in a previous quarter.
Drawn as a dashed line entering from the left edge, labeled with the session's quarter.

## Metrics

**GTM-touched deals (X of Y)** — Count of GTM-touched deals over all tracked deals.

**GTM-touched revenue (closed won)** — Sum of deal values for GTM-touched deals in
Closed Won. This is the deals' full value, not a claimed share of it.

**GTM-touched open pipeline** — Sum of deal values for GTM-touched deals in open stages
(Prospecting, Qualification, Proposal, Negotiation).

**Win rate** — Closed Won ÷ (Closed Won + Closed Lost), computed separately for the
GTM-touched group and the untouched group. Open deals are not in the denominator.

**Average deal size** — Mean deal value across all deals in the group (open and closed).

**Average sales cycle** — Mean days from open date to close date, over closed deals that
have a close date recorded.

**GTM-touched value per team hour** — (GTM-touched won revenue + GTM-touched open
pipeline) ÷ total team hours logged on sessions (prep + delivery). A throughput measure of
enablement effort, not a revenue claim.

**Demand share** — A use case's share of total deal value across *all* tracked deals
(touched or not).

**Coverage share** — A use case's share of total enablement effort, weighted by session
hours (by session count if no hours are recorded).

**"Invest here" / "Well covered" / "Balanced"** — Demand share minus coverage share:
≥ +5 points → *Invest here*; ≤ −5 points → *Well covered*; otherwise *Balanced*.

**GTM-touched pipeline opened by month** — Total value of GTM-touched deals bucketed by
the month their open date falls in, shown per fiscal quarter. Months that have not started
show "Coming soon" rather than $0.

## Caveats & conventions

- **Fiscal calendar** — IBM's fiscal year matches the calendar year; quarters are calendar
  quarters (Q1 = Jan–Mar). All headline figures are **year to date** from the start of the
  current fiscal year, based on the data entered.
- **Small samples** — When either group is small, the comparison carries an explicit
  caveat ("read as an early signal, not a proven effect").
- **Timing ≠ causation** — A deal opening after a session does not prove the session
  caused it. The comparison view (win rate / size / cycle by group) exists precisely so the
  data, not the framing, makes whatever case there is.
- **Data entry** — v1 is manual entry; figures reflect what has been entered and are only
  as complete as the entries. Deals and sessions are editable so records can be corrected
  as they progress.

Questions or corrections: contact the enablement team.
