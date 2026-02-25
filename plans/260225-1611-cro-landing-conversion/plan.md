---
title: "WellNexus CRO: Landing Page Conversion Lift"
description: "Optimize hero copy, CTAs, social proof placement, and form flow to increase partner signups"
status: pending
priority: P1
effort: 6h
branch: main
tags: [cro, conversion, landing, vietnam]
created: 2026-02-25
---

# CRO Plan — WellNexus Landing Page

**Target:** wellnexus.vn · Goal: Partner registration CR lift

## Executive Summary

Site is a Vietnamese health+MLM social commerce platform (SPA, React/Vite). Landing page has strong visual polish but suffers from **vague above-fold headline, feature-first bento grid, FOMO social proof that reads as fake, and a secondary CTA that directs nowhere**. Venture/register page loses momentum. Exit intent popup is solid but urgency copy is generic.

## Issues Found (Priority Order)

| # | Issue | CRO Principle | Impact |
|---|-------|---------------|--------|
| 1 | Hero headline "Xây dựng sự nghiệp / Với WellNexus" is company-centric, not customer-outcome | 4-U Formula | 🔴 HIGH |
| 2 | Primary CTA "Bắt đầu ngay" — generic, no specificity | CTA 1st-person psychology | 🔴 HIGH |
| 3 | Secondary CTA "Tìm hiểu thêm" routes nowhere (no `onClick`) | Navigation friction | 🔴 HIGH |
| 4 | Bento grid shows FEATURES (AI Coach, Global) before BENEFITS (income proof) | Benefit-first language | 🟡 MED |
| 5 | Hero stats appear BELOW bento grid — below the fold on mobile | F-Pattern + Mobile thumb | 🟡 MED |
| 6 | Social proof ticker names/actions look template-generated, no photos | Trust signal quality | 🟡 MED |
| 7 | Exit intent urgency "Chỉ còn 157 suất" — static number, never updates | Genuine urgency only | 🟡 MED |
| 8 | No objection-handling content before CTA (no FAQ, no guarantee badge) | Objection preemption | 🟡 MED |
| 9 | Testimonials use only name+rank, no photos → low trust | Social proof near CTAs | 🟡 MED |
| 10 | No sticky CTA on scroll — visitor must scroll back to convert | Conversion accessibility | 🟢 LOW |

## Phases

| Phase | Description | Effort | Status | Link |
|-------|-------------|--------|--------|------|
| 01 | Hero Copy Rewrite + Primary CTA Fix | 1h | ⬜ pending | [→](./phase-01-hero-copy-and-cta.md) |
| 02 | Bento Grid Benefit-First Restructure | 1h | ⬜ pending | [→](./phase-02-bento-benefit-reorder.md) |
| 03 | Social Proof Authenticity Upgrade | 1.5h | ⬜ pending | [→](./phase-03-social-proof-upgrade.md) |
| 04 | Objection Preemption Section + Trust Cluster | 1.5h | ⬜ pending | [→](./phase-04-objection-faq-trust.md) |
| 05 | Sticky CTA Bar + Exit Intent Urgency Fix | 1h | ⬜ pending | [→](./phase-05-sticky-cta-urgency.md) |

## Key Files

- `src/pages/LandingPage.tsx` — page assembly, HERO_STATS, SOCIAL_PROOF_ITEMS, TESTIMONIALS
- `src/components/landing/landing-hero-section.tsx` — hero layout + CTAs
- `src/components/landing/landing-roadmap-section.tsx` — roadmap cards
- `src/components/HeroEnhancements.tsx` — TrustBadges, TestimonialsCarousel, SocialProofTicker
- `src/components/marketing/ExitIntentPopup.tsx` — exit intent modal
- `src/locales/vi.ts` — all Vietnamese copy

## Success Metrics

- Partner registration CR: baseline → +20%
- Exit intent popup CTR: measure click-to-register rate
- Hero CTA click rate: track with analytics event
- Bounce rate on landing page: target -10%
