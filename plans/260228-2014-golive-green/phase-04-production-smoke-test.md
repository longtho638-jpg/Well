---
title: "Phase 04: Production Smoke Testing & Verification"
description: "Final verification on the live site."
status: pending
priority: P1
created: 2026-02-28
---

# Phase 04: Production Smoke Testing & Verification

## Context Links
- **URL:** [https://wellnexus.vn](https://wellnexus.vn)
- **Verification Protocol:** `CLAUDE.md` Rule 2

## Overview
"Binh Pháp Rule #0": Do not report "DONE" until production is verified Green.

## Requirements
- HTTP 200 on production URL.
- No console errors on live site.
- No raw i18n keys visible on UI.

## Implementation Steps
1. **HTTP Check:** `curl -sI https://wellnexus.vn`.
2. **Visual Audit:** Open site in browser, check core pages (Home, Marketplace).
3. **i18n Check:** Verify no `t('...')` strings appear on UI.
4. **Console Check:** Verify no Red errors in browser console.

## Todo List
- [ ] Perform HTTP status check.
- [ ] Visual inspection of critical components.
- [ ] Verify zero raw i18n keys on live site.

## Success Criteria
- HTTP 200 OK.
- Visuals match design (Aura Elite).
- No functional regressions on production.
