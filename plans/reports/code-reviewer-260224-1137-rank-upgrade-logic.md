## Code Review Summary: Rank Upgrade Logic

### Scope
- Files reviewed: `src/services/policyService.ts`, `supabase/functions/agent-reward/index.ts`
- Lines of code analyzed: ~500
- Review focus: Rank upgrade logic, conditions, and execution

### Overall Assessment
The rank upgrade logic is implemented in the `agent-reward` edge function. It relies on a `rankUpgrades` array fetched dynamically from the `policy_config` table (introduced in Admin 3.1). While the upgrade logic itself is functional and well-structured, there are significant issues regarding how the conditions (specifically `teamVolume`) are calculated and updated.

### Critical Issues

1.  **`teamVolume` is Never Updated**:
    -   The upgrade logic relies on `user.team_volume` to evaluate the `teamVolumeRequired` condition.
    -   However, a thorough search of the codebase and Supabase migrations/functions reveals that **`team_volume` is never updated anywhere** when an order is completed or a downline makes a sale.
    -   This means any rank upgrade requiring `teamVolumeRequired > 0` will **always fail** because `teamVolume` will remain at its default value (`0`).
    -   **Evidence**: `grep -rn "team_volume" supabase/` shows it's initialized but never modified (except for a reset to 0 in `clean_test_data.sql`).

### High Priority Findings

1.  **Multiple Rank Jump Issue**:
    -   The `applicableUpgrade` is found using `.find(upgrade => upgrade.fromRank === buyerRoleId)`.
    -   This means a user can only upgrade one rank at a time (e.g., from Rank 8 to Rank 7). If their lifetime sales jump drastically (e.g., qualifying them for Rank 6 immediately), they will only be upgraded to Rank 7 because the function stops after evaluating the immediate next rank.
    -   While the function is triggered on every order completion, a large single order could theoretically qualify someone for a higher rank directly, but they'd have to wait for another order to trigger the next evaluation.

2.  **`minDownlineRank` Condition Check Flaw**:
    ```typescript
    let meetsDownlineRankRequirement = true;
    if (applicableUpgrade.conditions.minDownlineRank) {
        const qualifiedDownlines = downlines?.filter(
            (d: any) => d.role_id <= applicableUpgrade.conditions.minDownlineRank
        ) || [];
        meetsDownlineRankRequirement = qualifiedDownlines.length >= (applicableUpgrade.conditions.directDownlinesRequired || 0);
    }
    ```
    -   This logic checks if there are enough downlines that meet the minimum rank. However, if `applicableUpgrade.conditions.directDownlinesRequired` is 0 or undefined, `meetsDownlineRankRequirement` will be `true` even if there are no downlines at all. This might be intended behavior, but it intertwines `minDownlineRank` and `directDownlinesRequired` in a way that could lead to unexpected results if `minDownlineRank` is set but `directDownlinesRequired` is not.

### Medium Priority Improvements

1.  **Hardcoded Rank Names**:
    -   Rank names are hardcoded in a `rankNames` object inside the edge function (`supabase/functions/agent-reward/index.ts`).
    -   This duplicates logic and makes it harder to change rank names in the future. It should ideally be centralized or fetched from the policy config.

### Recommended Actions

1.  **Fix `team_volume` Calculation**:
    -   Implement a database trigger or an RPC function to recursively calculate and update the `team_volume` for all uplines whenever an order is completed.
    -   Alternatively, calculate `teamVolume` dynamically during the rank upgrade check (similar to how `lifetimeSales` is calculated), though this could be computationally expensive for deep trees.
2.  **Refactor Upgrade Evaluation**:
    -   Change the logic to find the *highest* possible rank the user qualifies for, rather than just checking the upgrade from their current rank. Sort `rankUpgrades` by `toRank` (ascending, where 1 is highest) and iterate to find the best match.
3.  **Clarify Downline Rank Requirement**:
    -   Separate the logic for `directDownlinesRequired` and `minDownlineRank` to ensure both conditions are evaluated independently and accurately.

### Unresolved Questions
- Is `team_volume` supposed to be calculated asynchronously, or was it an oversight that it's never updated?
- Should users be able to skip ranks if their sales volume justifies it?
