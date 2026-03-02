/**
 * mockData.ts — barrel re-export.
 * Data split into domain-focused companion files:
 *   - mock-products-transactions-quests-revenue-chart.ts
 *   - mock-users-team-members-referrals.ts
 *   - mock-landing-pages-and-redemption-marketplace.ts
 */

export {
  PRODUCTS,
  TRANSACTIONS,
  DAILY_QUESTS,
  REVENUE_DATA,
} from './mock-products-transactions-quests-revenue-chart';

export {
  CURRENT_USER,
  TEAM_MEMBERS,
  TEAM_METRICS,
  REFERRALS,
  REFERRAL_STATS,
  AT_RISK_MEMBERS,
  TEAM_INSIGHTS,
} from './mock-users-team-members-referrals';

export {
  LANDING_PAGE_TEMPLATES,
  USER_LANDING_PAGES,
  REDEMPTION_ITEMS,
  REDEMPTION_ORDERS,
} from './mock-landing-pages-and-redemption-marketplace';