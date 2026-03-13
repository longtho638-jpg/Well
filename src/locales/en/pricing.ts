/**
 * Pricing Page i18n - English
 * 3-tier subscription pricing with FAQ
 */

export const pricing = {
  // Page metadata
  page_title: "WellNexus Pricing - Choose Your Plan",
  page_description: "Subscribe to WellNexus with 3 tiers: Free, Pro, Enterprise. Start free, upgrade when ready.",

  // Header
  choose_plan: "Choose Your Plan",
  subtitle: "Invest in your health and income with flexible plans",

  // Billing toggle
  monthly: "Monthly billing",
  yearly: "Yearly billing",
  toggle_billing: "Toggle billing cycle",
  save_2_months: "Save 2 months",
  save: "Save",

  // Tier names
  free_name: "Free",
  pro_name: "Pro",
  enterprise_name: "Enterprise",

  // Tier descriptions
  free_description: "Perfect for starting your wellness journey",
  pro_description: "For those serious about health and income",
  enterprise_description: "Complete solution for teams and businesses",

  // Pricing display
  per_month: "/month",
  per_year: "/year",
  free: "Free",

  // Tier badges
  most_popular: "Most Popular",
  current_plan: "Current Plan",
  processing: "Processing...",
  processing_payment: "Creating payment link...",
  payment_created: "Payment link created successfully",
  forever_free: "forever free",

  // CTA buttons
  upgrade: "Upgrade",
  downgrade: "Downgrade",
  cancel: "Cancel Subscription",
  included: "Included",

  // Features (main features shown in cards)
  features: {
    // Basic features
    basic_dashboard: "Basic dashboard",
    marketplace_access: "Marketplace access",
    basic_support: "Basic email support",

    // Pro features
    everything_in_free: "Everything in Free",
    advanced_analytics: "Advanced analytics",
    ai_copilot: "AI Copilot - Health assistant",
    priority_support: "Priority support",
    health_coach: "AI Health Coach",

    // Enterprise features
    everything_in_pro: "Everything in Pro",
    white_label: "White-label customization",
    multi_network: "Multi-network management",
    api_access: "API access",
    dedicated_support: "24/7 Dedicated support",
    custom_integrations: "Custom integrations",

    // Comparison table features (prefixed with 'table_' to avoid duplicates)
    table_dashboard: "Dashboard",
    table_marketplace: "Marketplace",
    table_analytics_basic: "Basic analytics",
    table_analytics_advanced: "Advanced analytics",
    table_ai_copilot: "AI Copilot",
    table_health_coach: "Health Coach",
    table_priority_support: "Priority support",
    table_white_label: "White-label",
    table_multi_network: "Multi-network",
    table_api_access: "API access",
    table_dedicated_support: "Dedicated support",
    table_team_management: "Team management",
    table_commission_tracking: "Commission tracking",
    table_referral_program: "Referral program",
    table_export_data: "Export data",
    table_custom_reports: "Custom reports",
  },

  // Feature comparison table
  feature_comparison: "Feature Comparison",
  feature: "Feature",
  comparison_subtitle: "Compare features across all plans to find your perfect fit",

  // FAQ Section
  faq_title: "Frequently Asked Questions",
  faq_subtitle: "Find answers to common questions",

  // FAQ Questions & Answers
  faq: {
    // Billing
    q1_question: "Can I change my plan anytime?",
    q1_answer: "Yes, you can upgrade or downgrade your subscription anytime. When upgrading, charges are prorated. When downgrading, changes take effect next billing cycle.",

    q2_question: "What payment methods do you accept?",
    q2_answer: "We accept bank QR payments (Vietcombank, Techcombank, BIDV...), credit/debit cards, and MoMo e-wallet.",

    q3_question: "Is there a refund policy?",
    q3_answer: "We offer a 7-day money-back guarantee for Pro and Enterprise plans. If not satisfied, contact support for a full refund.",

    // Features
    q4_question: "What does the Free plan include?",
    q4_answer: "Free plan includes basic dashboard access, health marketplace, order tracking, and email support. Great starting point.",

    q5_question: "How does AI Copilot work?",
    q5_answer: "AI Copilot is an intelligent health assistant providing personalized recommendations, goal tracking, and 24/7 health Q&A in natural language.",

    q6_question: "How many team members can I add?",
    q6_answer: "Pro plan supports up to 10 members. Enterprise plan supports unlimited members with advanced team management tools.",

    // Technical
    q7_question: "When can I cancel my subscription?",
    q7_answer: "You can cancel anytime from your account settings. Your access continues until the end of your current billing period.",

    q8_question: "Is my data secure?",
    q8_answer: "Yes. We use end-to-end encryption, store data in Vietnam, and follow the highest security standards. Your health data is private.",

    // Enterprise
    q9_question: "What's special about Enterprise?",
    q9_answer: "Enterprise includes all Pro features, plus white-label customization, API access, custom integrations, 24/7 dedicated support, and unlimited team management.",

    q10_question: "Do you offer discounts for nonprofits or education?",
    q10_answer: "Yes! We offer 20% discount for nonprofits and 30% for educational institutions. Contact sales@wellnexus.vn for details.",
  },

  // Trust badges
  trust: {
    secure_payment: "Secure payment",
    money_back: "7-day money-back guarantee",
    support_24_7: "24/7 Support",
    cancel_anytime: "Cancel anytime",
  },

  // Testimonials
  testimonials: {
    title: "What Users Say",
    subtitle: "Thousands of people trust and use WellNexus daily",
    sarah_name: "Sarah Nguyen",
    sarah_role: "Pro Distributor",
    sarah_content: "WellNexus helped me increase my income by 40% in just 2 months. The AI Copilot is truly useful!",
    david_name: "David Tran",
    david_role: "Leader of 50+ team",
    david_content: "Team management has never been easier. Advanced analytics help me make accurate decisions.",
    lisa_name: "Lisa Pham",
    lisa_role: "Enterprise Business",
    lisa_content: "API integration and white-label saved us months of development. The 24/7 support is amazing!",
  },

  // CTA sections
  cta_bottom: {
    title: "Ready to get started?",
    subtitle: "Join thousands improving their health every day",
    get_started: "Get started free",
  },

  // License management keys (used by admin components)
  licenses: {
    user_not_found: "User not found",
    user_required: "Please select a user",
    expires_required: "Please select expiration date",
    create_title: "Create New License",
    user_label: "User",
    user_placeholder: "Search user...",
    tier_label: "Subscription tier",
    quota_limit_preview: "Quota limit",
    api_calls_label: "API calls/month",
    tokens_label: "Tokens/month",
    expires_label: "Expiration date",
    success_title: "License created",
    copy_key_instruction: "Copy this key now - won't be shown again!",
    close: "Close",
    creating: "Creating...",
    created: "Created",
    create_button: "Create License",
    unsuspend: "Unsuspend",
    suspend: "Suspend",
    change_tier: "Change tier",
    view_audit_log: "View audit log",
    revoke: "Revoke",
    suspend_confirm: "Confirm suspend license",
    revoke_confirm: "Confirm revoke license",
    suspend_reason_placeholder: "Reason for suspend...",
    revoke_reason_placeholder: "Reason for revoke...",
    cancel: "Cancel",
    error: "Error",
    all: "All",
    license_key: "License Key",
    user: "User",
    tier: "Tier",
    status: "Status",
    quota_usage: "Quota usage",
    expires: "Expires",
    actions: "Actions",
    no_licenses: "No licenses yet",
    api_calls: "API calls",
    tokens: "Tokens",
  },

  // Overage billing keys
  overage: {
    upgrade_needed: "Upgrade plan for more usage",
    upgrade_description: "Your plan has reached its limit. Upgrade to continue.",
    upgrade_now: "Upgrade now",
    view_plans: "View plans",
  },

  // FAQ expanded keys
  faq_intro: "Learn more about subscription plans",
  faq_contact: "Contact support",
};
