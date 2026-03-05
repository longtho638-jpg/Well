---
title: "Phase 1 - Backend Integration"
description: "Implement backend infrastructure for vendor dashboard functionality"
status: pending
priority: P2
effort: 2h
branch: feature/vendor-dashboard-enhancement
tags: [backend, database, api, security]
created: 2026-03-04
---

# Phase 1: Backend Integration for Vendor Dashboard

## Context Links
- Plan: `/Users/macbookprom1/mekong-cli/apps/well/plans/260304-2218-vendor-dashboard-enhancement/plan.md`
- Current vendor dashboard: `src/components/marketplace/VendorDashboard.tsx`
- Product service: `src/services/productService.ts`

## Overview
Priority: High | Status: Pending | Brief: Implement backend infrastructure to support vendor-specific product management, including database schema updates, RLS policies, and API endpoints.

## Key Insights
- Current product schema needs vendor identification field
- Supabase RLS policies must be updated for vendor data isolation
- Existing productService needs extension for vendor-specific operations
- Authentication checks required to validate vendor permissions

## Requirements

### Functional Requirements
- Add vendor_id field to products table
- Restrict product visibility to owning vendor
- Allow vendors to create/update/delete only their products
- Provide vendor-specific analytics endpoints

### Non-functional Requirements
- All changes must maintain existing product functionality
- RLS policies must prevent cross-vendor data access
- Database migrations must be backward compatible
- Performance should not degrade for non-vendor users

## Architecture
- Database: Add vendor_id column to existing products table
- RLS Policies: Update to restrict access by vendor_id for vendors
- API: Extend productService with vendor-scoped methods
- Auth: Use existing Supabase auth to identify vendor users

## Related Code Files
- `supabase/migrations/` (database schema updates)
- `supabase/functions/` (server-side functions)
- `src/services/productService.ts` (client-side service)
- `src/types/index.ts` (update Product type with vendor_id)
- `src/hooks/useAuth.ts` (verify vendor permissions)

## Implementation Steps

### Step 1: Update Database Schema (30 min)
1. Add vendor_id column to products table in migration
2. Create index on vendor_id for performance
3. Update row-level security policies to include vendor access control

### Step 2: Update TypeScript Types (15 min)
1. Modify Product interface to include vendor_id field
2. Update create/update DTOs to include vendor validation

### Step 3: Extend ProductService (45 min)
1. Add methods for vendor-specific product operations
2. Update existing methods to respect vendor boundaries
3. Add validation for vendor permissions

### Step 4: Implement Authorization Logic (30 min)
1. Create helper function to verify vendor ownership
2. Add middleware/function to check vendor permissions
3. Update existing product endpoints with vendor checks

## Todo List
- [x] Create database migration for vendor_id column
- [x] Update RLS policies for vendor access control
- [x] Update Product type with vendor_id field
- [x] Extend productService with vendor-specific methods
- [x] Implement vendor authorization checks
- [ ] Test vendor data isolation
- [ ] Verify existing functionality remains intact

## Success Criteria
- Vendors can only see their own products
- Vendors can CRUD their own products only
- Non-vendor users see products as before
- All existing product functionality continues to work
- Database queries remain performant
- Authorization prevents unauthorized access

## Risk Assessment
- Data migration must be handled carefully to avoid data loss
- RLS policy changes must be tested thoroughly to prevent access issues
- Existing product functionality must not be broken

## Security Considerations
- Ensure vendor_id cannot be spoofed during product creation
- Verify RLS policies prevent cross-vendor data access
- Implement proper validation to prevent privilege escalation
- Log vendor access attempts for audit purposes

## Next Steps
- Create database migration script
- Test RLS policies in development environment
- Update frontend to utilize vendor_id when available
- Implement vendor dashboard UI components