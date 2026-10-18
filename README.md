# Business Performance & Revenue Analytics Dashboard

An interactive, front-end-only admin dashboard for tracking **leads → quotations → deals → orders → payments** and revenue. It was built as the Front End Development internship assignment for **SecureRegent**.

**Live demo:** https://prattaykun.github.io/revenue-analytics-dashboard/

All data is dummy data, generated in the browser from a fixed seed. No backend or database is needed.

## Features

**Global filters (they drive every KPI, chart and table)**
- Date range: **Today**, **Last 7 Days**, **Last 30 Days** and a **Custom date range**
- Every KPI shows the **% change against the previous equivalent period**: green for an improvement, red for a decline. "Today" is compared with the same time yesterday.
- Extra filters: sales user and service category
- **Export** downloads the filtered records behind the current page as CSV

**1. Lead Analytics**
- KPI cards for total, qualified, converted and unqualified leads, plus conversion rate
- Clickable lead funnel, with Unqualified shown as a separate branch
- Lead trend (hourly, daily or weekly depending on the range), lead status trend and lead source trend
- Lead source donut and a searchable, sortable leads table with status and source filters

**2. Quotation Analytics**
- Quotations by service, quotation value by service, quotation status and quote-to-deal conversion rate
- Service-wise table (quotes, value, accepted, pending, rejected, conversion)
- Full quotations table and **lead-wise quotation history**

**3. Deals & Revenue**
- Deals vs revenue by service, revenue by category and a priority breakdown
- Daily revenue trend (booked vs collected), total vs collected vs outstanding, and deal progress (stage plus delivery progress)
- Deals table with collected, outstanding, delivery % and paid %

**4. Orders & Payments**
- Order status, stage progress by service, orders created vs completed, and the collection trend (daily plus cumulative)
- Payments by mode, an orders table with stage progress, and the payment history

**Drill-downs and relationships**
- One lead → many quotations and deals. One deal → many orders and payments.
- **Lead detail** page: profile, totals, activity timeline, quotations, deals, orders and payments
- **Deal detail** page: value, collected, outstanding, delivery progress, a milestone tracker, orders and payments
- Clicking a funnel stage, donut slice, bar, KPI card, table row or CRM activity item navigates to the related view or filters it

**Also included:** sales and operations team activity, a recent CRM activity feed, a target-achievement gauge, and a responsive layout with a collapsible sidebar on mobile.

## Tech

- **React 19 + TypeScript**, built with **Vite**
- **Tailwind CSS v4** for styling
- **Recharts** for charts, with a custom SVG funnel
- **React Router** (`HashRouter`, so deep links work on GitHub Pages)
- **lucide-react** for icons
- A seeded PRNG (mulberry32) builds about 1,000 leads with linked quotations, deals, orders and payments over the last 120 days, relative to the visitor's current date. Values are in INR.

```
src/
  data/        types + seeded relational data generator
  lib/         filter context (date ranges, previous period, buckets), metrics, formatting, CSV export
  components/  layout, KPI cards, charts, data table, funnel
  pages/       Overview, Leads, Quotations, Deals, Orders, Lead/Deal detail
```

## Run locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Deployment

`.github/workflows/deploy.yml` builds the app and publishes `dist/` to **GitHub Pages** on every push to `main`. To turn it on, go to *Settings → Pages* and set the source to **GitHub Actions**. `vite.config.ts` uses `base: './'`, so the build works from the repository sub-path.

---
Built by **Prattay Roy Chowdhury**.
