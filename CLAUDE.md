# CLAUDE.md — EasyPick AI Tools Website

## 1. Project Overview
"이지픽" (EasyPick) is a React-based AI tools platform for Korean users.  
It showcases and categorizes AI tools, provides prompt generation, workflow guides, and supports monetization via subscription.

- **Target Audience**: Korean users, mobile-first design
- **Core Stack**: React 18, Vite 6, Tailwind CSS 4, Zustand, Supabase, Shadcn/ui, Lucide React, Framer Motion
- **Routing**: React Router 6 (SPA)
- **Backend**: Supabase (Postgres DB, Auth, profiles, subscription management)
- **Deployment**:  
  - **Current**: GitHub Pages (`gh-pages`, `dist`), Vite `base` = `/ai-tool/`
  - **Planned**: Vercel migration for monetization & server/webhook features (`base` = `/` or removed)

---

## 2. Architecture

### Routes
- `/` — Landing page (NewMainLanding)
- `/tools` — AI tools discovery/filtering
- `/prompts` — Prompt generation & templates
- `/workflows` — Workflow templates & guides
- `/payment/success` & `/payment/fail` — Payment results

### State Management
- **Zustand** (`src/store/`):  
  - `authStore.js` — Authentication, profiles, subscriptions  
  - `promptStore.js` — Prompt templates & state
- **React Router State** — Navigation & route state
- **Local Component State** — Forms, modals, UI interactions

### Feature Modules (`src/features/`)
- `auth/` — Authentication (social login, forms)
- `payment/` — TossPayments & PayPal integrations
- `prompt-launcher/` — Prompt generation & model comparisons
- `workflows/` — Workflow templates & guides

### Components
- **Layout**: `AppLayout` — Fixed header, navigation, responsive
- **UI System**: Shadcn/ui + Radix primitives
- **Dynamic Icons**: `AIToolIcon` via @iconify/react
- **Modal System**: Reusable for auth, payments, details, comparisons

### Data
- **Static**: `src/data/aiTools.js`, `src/data/aiUsageGuides.js`, `src/features/*/data/`
- **Service Layer**: `src/services/` (authService, paymentService, aiToolsService)

---

## 3. Operation Flow (Per Session)

1. `/security-scan` — 0 production dependency vulnerabilities
2. `/build` — 0 warnings, verify bundle/source maps
3. `/deploy` — Verify production deployment URL
4. `/seo-lighthouse` — Perf/Acc/Best/SEO **≥ 95**

> Slash commands defined in `.claude/commands/*.md`

---

## 4. Permissions & Security

- **IAM Rule Priority**: `deny` > `allow`
- **Config Files**:  
  - Shared: `.claude/settings.json`  
  - Local (gitignored): `.claude/settings.local.json`
- **Allow**: `git:*`, `npm run build:*`, `npm audit:*`, `vercel:*`, `WebFetch(github.com)`
- **Deny**: Read `.env`, `./secrets/**`, indiscriminate `WebFetch`, destructive file ops
- **Secrets**: No secrets in repo — manage via `.env` locally or deployment environment vars

---

## 5. Environment Variables (Names Only)

VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
GA4_MEASUREMENT_ID
TOSS_CLIENT_KEY
TOSS_SECRET_KEY
PAYPAL_CLIENT_ID
PAYPAL_SECRET
CLERK_PUBLISHABLE_KEY
GOOGLE_CLIENT_ID
KAKAO_JS_KEY

---

## 6. Slash Commands (Project-Specific)

- `/security-scan` — `npm audit --production` summary by severity/package/action
- `/build` — `npm run build` warnings/errors/bundle size summary
- `/deploy` —  
  - GH Pages: `npm run deploy` (after build)  
  - Vercel: `vercel --prod --confirm`
- `/seo-lighthouse` — Report & top 5 improvement suggestions

---

## 7. Analytics & Metrics

- **GA4 Events**: `page_view`, `search`, `view_item`, `purchase`, `sign_up`
- **KPI**: Free→Pro conversion, search success rate, bookmark conversion, DAU/MAU, MRR

---

## 8. Release Checklist

- [ ] Security: High 0 / patched
- [ ] Build: 0 warnings / bundle size checked
- [ ] Deploy: URL verified / rollback notes ready
- [ ] Performance: Lighthouse ≥ 95 / accessibility focus & contrast
- [ ] Analytics: GA4 real-time tracking verified (`search`, `purchase`)

---

## 9. Definition of Done

- Security scan High 0, build warnings 0
- Verified deployment URL
- Release notes: 5 lines (what / why / how / risks / rollback)
- GA4 core events tracking
- Smoke test basic routes

---

## 10. Development Commands

npm run dev # Local dev (localhost:3002)
npm run build # Production build
npm run lint # ESLint
npm run preview # Local preview of production build

---

## 11. Code Quality

- ESLint flat config (`eslint.config.js`)
- React Hooks rules via `eslint-plugin-react-hooks`
- Ignore unused uppercase constants
- Hot reload with react-refresh

---

## 12. Deployment

- **Dev Server**: localhost:3002
- **Build Output**: `/dist`
- **Assets**: `/public`
- **GitHub Pages**: Configured homepage URL
- **Vercel**: Planned migration for server/webhook features

---

## 13. Change Log

- YYYY-MM-DD: Merged architecture, security, deployment, and analytics documentation into single CLAUDE.md

