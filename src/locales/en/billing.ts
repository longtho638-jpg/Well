// Billing & Subscription translations
export const billing = {
  status: {
    active: 'Active',
    past_due: 'Past Due',
    incomplete: 'Incomplete',
    trialing: 'Trialing',
    canceled: 'Canceled',
  },
  amount_due: 'Amount Due',
  usage_this_period: 'Usage This Period',
  renews_on: 'Renews On',
  update_payment: 'Update Payment',
  update_payment_method: 'Update Payment Method',
  overage_warning: 'You have exceeded your limit - overage charges apply',
  over_limit: 'Over Limit',
  used: 'Used',
  limit: 'Limit',
  overage_charge: 'Overage Charge',
  payment_overdue: 'Payment Overdue',
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
}
