# Phase 4: Export and Heavy Operations

**Context Links**
- [Overview Plan](./plan.md)
- [Research Report](../reports/researcher-260130-1129-performance-optimization.md)

## Overview
**Priority**: Medium
**Status**: Pending
**Description**: Optimize data export features to handle large datasets without freezing the main thread, utilizing Web Workers.

## Key Insights
- Generating large CSV strings on the main thread blocks UI interactions.
- Web Workers run in a background thread, perfect for CPU-intensive tasks like data formatting.

## Requirements
- Create a Web Worker for CSV generation.
- Implement an export button that triggers the worker.
- Handle worker messages (success/error/progress).

## Architecture
- **Web Worker**: Independent script receiving JSON data and returning a Blob/URL.
- **Main Thread**: Sends data to worker, displays loading state, triggers download on completion.

## Related Code Files
- `src/workers/csvExport.worker.ts` (New)
- `src/hooks/useCsvExport.ts` (New)
- `src/pages/Admin/OrderList.tsx` (UI integration)

## Implementation Steps
1. **Create Web Worker**
   - Create `csvExport.worker.ts`.
   - Implement logic to convert JSON array to CSV string.
   - Post message back with the result.
2. **Create Export Hook**
   - `useCsvExport`: manages worker instance, loading state, and download trigger.
   - Ensure worker is terminated when component unmounts.
3. **Integrate in UI**
   - Add "Export CSV" button to Order List.
   - Connect to `useCsvExport`.
   - Show "Generating..." spinner during processing.

## Todo List
- [ ] Create `csvExport.worker.ts`
- [ ] Implement `useCsvExport` hook
- [ ] Add Export button to UI
- [ ] Test with large dataset (e.g., 10k rows)

## Success Criteria
- UI remains responsive (clickable, scrollable) while CSV is generating.
- CSV downloads correctly with all required fields.

## Risk Assessment
- **Risk**: Passing huge data objects to Worker can be slow (copying).
- **Mitigation**: Use Transferable Objects if possible, or fetch data directly in the worker (advanced). For <50k rows, copying is usually acceptable.

## Security Considerations
- Ensure CSV injection vulnerabilities are mitigated (sanitize cell values starting with `=`, `+`, `-`, `@`).
