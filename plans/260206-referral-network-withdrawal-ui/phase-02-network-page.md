# Phase 2: Network Visualization Page

## Context
- **Plan**: [Referral Network & Withdrawal UI](../plan.md)
- **Goal**: Create the interactive F1-F7 network tree visualization page.

## Overview
- **Priority**: P1
- **Status**: Completed
- **Description**: Implement `/dashboard/network` with a dual-view strategy: Interactive D3 tree for desktop and Nested Accordion for mobile.

## Requirements
1.  **Route**: `/dashboard/network`
2.  **Desktop View**:
    - Pan/Zoom canvas.
    - Node Card: Avatar, Name, Rank, Sales Volume.
    - Collapsible branches.
    - Glassmorphism styling.
3.  **Mobile View**:
    - Nested list with expand/collapse.
    - Optimized for small screens.
4.  **Data**: Load from `ReferralService`.

## Architecture
- **Page**: `src/pages/dashboard/NetworkPage.tsx`
- **Components**:
  - `src/components/network/NetworkTree.tsx` (Wrapper for `react-d3-tree`)
  - `src/components/network/NetworkNode.tsx` (Custom ForeignObject node for D3)
  - `src/components/network/MobileNetworkList.tsx` (Recursive component)
  - `src/components/network/NodeCard.tsx` (Shared UI for node info)

## Implementation Steps

1.  **Create Components Directory**
    - `src/components/network/`

2.  **Implement `NodeCard`**
    - Glassmorphism design (Tailwind `backdrop-blur`, `bg-white/10`).
    - Props: `name`, `rank`, `sales`, `avatar`.

3.  **Implement `NetworkTree` (Desktop)**
    - Initialize `Tree` from `react-d3-tree`.
    - Configure `renderCustomNodeElement` to use `NodeCard` (wrapped in `foreignObject`).
    - Handle window resize for centering.

4.  **Implement `MobileNetworkList` (Mobile)**
    - Recursive rendering of nodes.
    - Use `framer-motion` for expand/collapse animation.
    - Simple vertical layout with indentation.

5.  **Implement `NetworkPage`**
    - Fetch data using `useQuery` or `useEffect` + `ReferralService`.
    - Responsive switch: Hidden `NetworkTree` on mobile, Hidden `MobileNetworkList` on desktop.
    - Loading states (Skeleton).

## UI/UX Details
- **Colors**:
  - Diamond: Cyan/Blue glow
  - Gold: Gold glow
  - Silver: Silver/Gray
  - Member: Bronze/Orange
- **Interactions**:
  - Click node to toggle collapse.
  - Hover node to see details (Tooltip).

## Validation
- Tree renders correctly with mock data.
- Mobile view works smoothly on phone simulation.
- No performance lag with >500 nodes (virtualization/collapsing).
