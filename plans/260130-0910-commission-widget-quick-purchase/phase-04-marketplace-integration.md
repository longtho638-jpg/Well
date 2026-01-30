# Phase 4: Marketplace Integration

## Context
- **Parent Plan:** [Commission Widget & Quick Purchase Modal](./plan.md)
- **Phase 2:** [Quick Purchase Modal](./phase-02-quick-purchase-modal.md)

## Overview
- **Date:** 2026-01-30
- **Description:** Add the trigger mechanism for the Quick Purchase Modal in the Marketplace view.
- **Priority:** P1
- **Status:** Completed

## Key Insights
- **Accessibility:** A Floating Action Button (FAB) or a prominent header button makes the "Quick Buy" feature discoverable.
- **Context:** The modal needs access to store data, which `Marketplace.tsx` already has access to via hooks.

## Requirements

### Functional
1.  **Trigger:** Add a "Quick Buy" button (FAB style bottom-right, or Header button). *Decision: FAB for mobile friendliness.*
2.  **State:** Manage `showQuickBuy` boolean state in `Marketplace.tsx`.
3.  **Render:** Conditionally render `<QuickPurchaseModal />` when state is true.

## Architecture

### Component Hierarchy
```
Marketplace
├── GridPattern
├── Navigation
├── ...
├── ProductGrid
├── QuickPurchaseModal (NEW, wrapped in AnimatePresence)
└── FAB (NEW)
```

## Related Code Files
- **Modify:** `src/pages/Marketplace.tsx`

## Implementation Steps

1.  **Add State:**
    - `const [showQuickBuy, setShowQuickBuy] = useState(false);`

2.  **Import Component:**
    - `import { QuickPurchaseModal } from '@/components/marketplace/QuickPurchaseModal';`
    - `import { Zap } from 'lucide-react';` (Icon for button).

3.  **Implement FAB:**
    - Create a fixed position button (`fixed bottom-8 right-8`).
    - Style with high contrast (Gradient/Brand color).
    - `onClick={() => setShowQuickBuy(true)}`.

4.  **Render Modal:**
    - Place `<QuickPurchaseModal isOpen={showQuickBuy} onClose={() => setShowQuickBuy(false)} />` at the end of the component tree (before closing div).

## Todo List
- [ ] Add `showQuickBuy` state to Marketplace
- [ ] Implement Floating Action Button (FAB)
- [ ] Mount `QuickPurchaseModal`
- [ ] Test trigger interaction

## Success Criteria
- [ ] FAB appears on Marketplace page.
- [ ] Clicking FAB opens Quick Purchase Modal.
- [ ] Closing modal returns focus to Marketplace.

## Risk Assessment
- **Risk:** FAB overlaps with Cart Drawer or other fixed elements.
- **Mitigation:** Adjust z-index (`z-50`) and bottom offset to avoid collisions.

## Security Considerations
- N/A
