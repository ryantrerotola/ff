# FlyArchive: Improvements & Mobile Strategy Plan

## Current State

The app is substantial — 20+ pages, 35+ API routes, full community features (forum, messaging, ratings, comments, saved patterns, hatch charts, news feed, admin pipeline). Built on Next.js 15 App Router, React 19, Tailwind CSS, Prisma/PostgreSQL, with AI-powered pattern extraction via Claude.

---

## Part 1: Missing Features (Prioritized by Impact)

### P0 — High-Impact Gaps

1. **PWA + Offline Support** (see Part 2)
   - No manifest.json, no service worker, no installability
   - Fly fishers are often in areas with zero cell signal — offline pattern access is critical

2. **Content Reporting / Flagging System**
   - Users have no way to report spam, inappropriate content, or incorrect patterns
   - Add a `ContentReport` model + `/api/reports` endpoint + user-facing "Flag" buttons
   - Admin moderation queue already exists — wire reports into it

3. **User Settings Page**
   - No `/settings` page exists — users can't change password, email, display name, or bio
   - Add `/settings` with account, profile, and notification preference sections

4. **Email Notifications**
   - Currently in-app only — no email for new messages, replies to your posts, pattern approvals
   - Add a lightweight email service (Resend or Nodemailer + SMTP)
   - Tie into existing Notification model with a `emailSent` flag

5. **Full-Text Search**
   - Current search uses Prisma `contains` (ILIKE) — no relevance ranking, no typo tolerance
   - Add PostgreSQL `tsvector` / `tsquery` full-text search indexes on patterns, forum posts, news
   - Alternatively: Algolia or Meilisearch for instant search with facets

### P1 — Important for Community Growth

6. **Social Login (OAuth)**
   - Add Google and GitHub OAuth via NextAuth.js or Lucia
   - Reduces registration friction significantly

7. **Image Upload**
   - Current image system requires external URLs — no direct upload
   - Add file upload to S3/R2/Cloudflare Images via presigned URLs
   - Users should be able to upload tying photos from their phone camera

8. **PDF Export for Patterns**
   - "Print this recipe" is a common fly tying workflow
   - Generate a clean PDF with materials list, step-by-step, and primary image
   - Use `@react-pdf/renderer` or server-side HTML-to-PDF

9. **Dark Mode**
   - No theme toggle exists
   - Add CSS custom properties + Tailwind `dark:` variant + `prefers-color-scheme` media query
   - Store preference in localStorage + cookie (for SSR)

10. **User Reputation / Badges**
    - Gamification drives engagement: "First Pattern Submitted", "10 Comments", "Helpful Reviewer"
    - Add a `Badge` model and badge-granting logic on key actions

### P2 — Nice-to-Have

11. **Material Inventory / Shopping List**
    - "Materials I have" vs "Materials I need" for a pattern
    - Pairs well with existing affiliate links

12. **Pattern Version History**
    - Track edits to community-submitted patterns
    - Simple diff view for admins

13. **Trending Algorithm with Temporal Decay**
    - Current "trending" is just vote count
    - Add time-weighted scoring: `score = votes / (age_hours + 2)^1.5`

14. **API Documentation (OpenAPI/Swagger)**
    - Useful if third-party tools or mobile apps want to integrate

15. **Accessibility Audit**
    - Add ARIA labels, keyboard navigation, focus management, screen reader testing

---

## Part 2: Web + Mobile Strategy

### Recommendation: PWA-first, Capacitor later if needed

A Progressive Web App gives 80% of the mobile benefit with 20% of the effort. React Native / Solito would require a near-complete rewrite and is not justified for a content-focused database app.

### Phase 1: PWA Foundation (1-2 weeks)

**Goal**: Installable on phones, cached for fast loads, basic offline fallback.

#### 1a. Web App Manifest
Create `src/app/manifest.ts` using Next.js 15's built-in manifest support:
- App name, icons (192px + 512px), theme color, display: standalone
- This enables "Add to Home Screen" on both iOS and Android

#### 1b. Service Worker via Serwist
Install `@serwist/next` (the maintained successor to next-pwa):
- Precache static assets (JS/CSS bundles)
- Runtime caching strategies:
  - **Pattern pages**: StaleWhileRevalidate (show cached, update in background)
  - **Pattern images**: CacheFirst with 30-day expiry
  - **API responses**: NetworkFirst with 5s timeout, fallback to cache
  - **Forum/Messages**: NetworkOnly (must be fresh)
- Offline fallback page at `/~offline`

#### 1c. Viewport & Safe Areas
Add viewport export to root layout:
- `viewportFit: "cover"` for iOS notch/Dynamic Island
- `env(safe-area-inset-*)` padding in globals.css
- `@media (display-mode: standalone)` styles

#### 1d. Mobile-Optimized Responsive UI
- **Bottom tab navigation** on screens < 768px (Patterns, Forum, News, Hatch, Profile)
- **Touch targets** minimum 44x44px on all interactive elements
- **Pull-to-refresh** on pattern lists and forum feeds
- **Loading skeletons** instead of spinners

### Phase 2: Offline Pattern Storage (2-3 weeks)

**Goal**: Anglers can view saved patterns with zero connectivity.

#### 2a. IndexedDB Pattern Store
Using the `idb` library:
- "Save for Offline" button on pattern detail pages
- Stores full pattern data: materials, variations, substitutions, primary image
- Syncs pattern images to Cache Storage API
- Visual indicator on pattern cards showing offline-available status

#### 2b. Offline Hatch Chart
- Hatch chart data is small enough to precache entirely
- Store all HatchEntry records in IndexedDB on first load
- Regional filtering works entirely client-side when offline

#### 2c. Offline Write Queue
- Queue offline actions (ratings, saves, hatch reports) in IndexedDB
- Replay queue against API routes when connectivity returns
- Use Background Sync API where supported, polling fallback elsewhere

### Phase 3: Capacitor Native Wrapper (3-5 weeks, optional)

**Only pursue if app store presence proves necessary for discoverability.**

#### Approach: Remote URL mode
- Capacitor WebView loads the hosted Next.js app (no static export needed)
- All SSR, API routes, and server features work unchanged
- Service worker + IndexedDB from Phases 1-2 provide offline support inside the WebView

#### Native plugins to add:
- **Push notifications** (Capacitor Push Notifications plugin)
- **Camera** (for uploading tying photos directly)
- **Share sheet** (share a pattern to social media natively)
- **App badge** (unread message count on app icon)

---

## Implementation Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | PWA manifest + Serwist service worker | 2-3 days | High |
| 2 | Mobile responsive: bottom nav, touch targets, safe areas | 2-3 days | High |
| 3 | Content reporting/flagging system | 1-2 days | High |
| 4 | User settings page | 1-2 days | High |
| 5 | Offline pattern storage (IndexedDB) | 3-4 days | High |
| 6 | Dark mode | 1-2 days | Medium |
| 7 | Image upload (S3/R2 presigned URLs) | 2-3 days | Medium |
| 8 | Email notifications (Resend) | 2-3 days | Medium |
| 9 | Full-text search (PostgreSQL tsvector) | 2-3 days | Medium |
| 10 | PDF pattern export | 1-2 days | Medium |
| 11 | Social login (OAuth) | 2-3 days | Medium |
| 12 | Capacitor native wrapper | 3-5 days | Low-Med |

**Recommended first batch**: Items 1-5 (PWA + mobile responsive + reporting + settings + offline storage). This transforms the app from "web-only desktop-first" to "installable mobile-friendly with offline" — the biggest possible leap for fly fishing users.
