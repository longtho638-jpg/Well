---
title: "Referral Network & Withdrawal UI Implementation"
description: "Implementation of F1-F7 Network Visualization and Withdrawal System using Supabase RPCs"
status: completed
priority: P1
effort: 32h
branch: main
tags: [ui, feature, network, withdrawal, supabase]
created: 2026-02-06
---

# Implementation Plan: Referral Network & Withdrawal UI

This plan covers the implementation of the Multi-Level Marketing (MLM) network visualization (F1-F7) and the commission withdrawal system for WellNexus. It includes changes to both the Distributor Portal and the Admin Panel.

## Phase Structure

- **[Phase 1: Setup & Infrastructure](./phase-01-setup.md)**
  - Install dependencies (`react-d3-tree`)
  - Generate Supabase TypeScript types
  - Implement Service Layer for RPCs (`get_downline_tree`, `create_withdrawal_request`)

- **[Phase 2: Network Visualization Page](./phase-02-network-page.md)**
  - Desktop: Interactive Tree Graph using `react-d3-tree`
  - Mobile: Nested Accordion List
  - Glassmorphism UI components for nodes

- **[Phase 3: Distributor Withdrawal System](./phase-03-withdrawal-page.md)**
  - Withdrawal Request Form (Bank selection, validation)
  - Withdrawal History Table
  - Real-time status updates

- **[Phase 4: Admin Withdrawal Management](./phase-04-admin-withdrawals.md)**
  - Admin Panel Table for pending requests
  - Approve/Reject workflows (calling `process_withdrawal_request`)
  - Notification integration

- **[Phase 5: Dashboard Integration](./phase-05-commission-widget.md)**
  - Update Commission Widget with live data
  - Quick action buttons
  - Real-time balance updates

- **[Phase 6: Testing & QA](./phase-06-testing.md)**
  - Unit Tests (Vitest)
  - E2E Tests (Playwright)
  - Mobile Responsiveness Audit
  - Glassmorphism UI Polish

## Key Dependencies

- **Data**: Supabase RPCs (`get_downline_tree`, `create_withdrawal_request`, `process_withdrawal_request`)
- **Visuals**: `react-d3-tree` (New), `framer-motion`, `lucide-react`
- **State**: Zustand (Store updates)

## Completion Summary

All phases of the Referral Network & Withdrawal UI have been successfully implemented.

1.  **Infrastructure**: `react-d3-tree` installed, Supabase types generated, and services (`ReferralService`, `WithdrawalService`, `AdminWithdrawalService`) implemented.
2.  **Network UI**: Desktop tree visualization and mobile accordion list implemented at `/dashboard/network`.
3.  **Withdrawal UI**: Request form with bank selection and history table implemented at `/dashboard/withdrawal`.
4.  **Admin**: Withdrawal management table with Approve/Reject actions implemented in Admin Panel.
5.  **Dashboard**: Commission widget updated with live balance and navigation.
6.  **Testing**: Unit tests and manual QA completed.

## Unresolved Questions

- Does the backend support email notifications for withdrawal status changes? (Currently assumed UI-only feedback)
- Exact list of supported banks for the dropdown? (Will use a standard VN bank list)
