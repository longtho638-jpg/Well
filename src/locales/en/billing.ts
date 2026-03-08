// Billing & Subscription translations
export const billing = {
  // General
  title: 'Billing & Subscription',
  description: 'Manage subscription, payment method, and usage',
  loading: 'Loading...',
  error: 'Error',
  no_organization: 'No organization found',
  no_subscription: 'No subscription found',
  load_error: 'Failed to load billing information',
  update_error: 'Failed to update payment method',

  // Status
  status: {
    active: 'Active',
    past_due: 'Past Due',
    incomplete: 'Incomplete',
    trialing: 'Trialing',
    canceled: 'Canceled',
    suspended: 'Suspended',
  },

  // Payment Update Page
  update_payment_title: 'Update Payment Method',
  update_payment_description: 'Update your payment method to continue using the service',
  payment_overdue_title: 'Payment Overdue',
  overdue_description: 'Your subscription payment has failed. Please update your payment method to avoid suspension.',
  amount_due_label: 'Amount Due',
  update_payment_method_btn: 'Update Payment Method',
  current_payment_method: 'Current Payment Method',
  change: 'Change',
  expires: 'Expires',
  billing_info: 'Billing Information',
  next_billing_date: 'Next Billing Date',
  status_label: 'Status',
  portal_opened: 'Stripe Customer Portal opened in new tab',
  secure_payment: 'Secure Payment via Stripe',
  stripe_secure: 'Your payment information is securely processed via Stripe Customer Portal.',
  stripe_privacy: 'Stripe Privacy Policy',

  // Legacy aliases (for backward compatibility - do not duplicate keys above)
  amount_due: 'Amount Due',
  update_payment_method: 'Update Payment Method',
  payment_overdue: 'Payment Overdue',
  usage_this_period: 'Usage This Period',
  renews_on: 'Renews On',
  update_payment: 'Update Payment',
  overage_warning: 'You have exceeded your limit - overage charges apply',
  over_limit: 'Over Limit',
  used: 'Used',
  limit: 'Limit',
  overage_charge: 'Overage Charge',
  overdue_message: 'Your subscription payment has failed. We will retry in {{days}} days.',
  cancel_in: 'Cancel in',
  days: 'days',

  billing_cycle: {
    monthly: 'Monthly',
    yearly: 'Yearly',
  },

  // Dunning emails
  dunning: {
    initial: {
      subject: '⚠️ Payment Failed - {{amount}}',
      title: 'Payment Failed',
      message: 'Payment for your {{planName}} subscription has failed. Amount: {{amount}}.',
      retry_notice: 'We will automatically retry in {{days}} days.',
      cta: 'Update Payment Method',
    },
    reminder: {
      subject: '🔔 Reminder: Payment Overdue - {{amount}}',
      title: 'Payment Reminder',
      message: 'Your {{planName}} subscription is past due due to failed payment.',
      warning: 'Please update your payment method to continue using the service.',
      cta: 'Update Now',
    },
    final: {
      subject: '🚨 Final Notice: Subscription Will Be Suspended',
      title: 'Final Notice',
      message: 'This is your final notice. Your subscription will be suspended in {{days}} days if not paid.',
      urgent: 'Act now to avoid service interruption.',
      cta: 'Pay Now',
    },
    cancel_notice: {
      subject: '❌ Subscription Canceled',
      title: 'Subscription Canceled',
      message: 'Your {{planName}} subscription has been canceled due to failed payment after multiple attempts.',
      support: 'If this is a mistake, please contact support.',
      cta: 'Contact Support',
    },
  },

  // SMS templates (short, concise messages)
  sms: {
    dunning_initial: '⚠️ WellNexus: Payment failed {{amount}} for {{plan_name}}. Update: {{payment_url}}',
    dunning_reminder: '🔔 WellNexus: Payment overdue {{amount}}. Service suspended in {{days}} days. Update: {{payment_url}}',
    dunning_final: '🚨 WellNexus: Final notice! Subscription suspended in {{days}} days. Pay now: {{payment_url}}',
    dunning_cancel: '❌ WellNexus: Subscription canceled due to failed payment. Contact support@wellnexus.vn',
    payment_confirmation: '✅ WellNexus: Payment {{amount}} received. Subscription reactivated. Thank you!',
  },
}
