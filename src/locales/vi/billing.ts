// Billing & Subscription translations
export const billing = {
  status: {
    active: 'Hoạt động',
    past_due: 'Quá hạn',
    incomplete: 'Chưa hoàn tất',
    trialing: 'Dùng thử',
    canceled: 'Đã hủy',
  },
  amount_due: 'Số tiền cần thanh toán',
  usage_this_period: 'Usage kỳ này',
  renews_on: 'Gia hạn vào',
  update_payment: 'Cập nhật thanh toán',
  update_payment_method: 'Cập nhật phương thức thanh toán',
  overage_warning: 'Bạn đã vượt quá giới hạn - sẽ bị tính phí bổ sung',
  over_limit: 'Vượt giới hạn',
  used: 'Đã dùng',
  limit: 'Giới hạn',
  overage_charge: 'Phí vượt mức',
  payment_overdue: 'Thanh toán quá hạn',
  overdue_message: 'Thanh toán subscription của bạn đã thất bại. Chúng tôi sẽ thử lại sau {{days}} ngày.',
  cancel_in: 'Hủy sau',
  days: 'ngày',
  billing_cycle: {
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm',
  },
  // Dunning emails
  dunning: {
    initial: {
      subject: '⚠️ Thanh toán thất bại - {{amount}}',
      title: 'Thanh toán thất bại',
      message: 'Thanh toán cho subscription {{planName}} của bạn đã thất bại. Số tiền: {{amount}}.',
      retry_notice: 'Chúng tôi sẽ tự động thử lại sau {{days}} ngày.',
      cta: 'Cập nhật phương thức thanh toán',
    },
    reminder: {
      subject: '🔔 Nhắc nhở: Thanh toán quá hạn - {{amount}}',
      title: 'Nhắc nhở thanh toán',
      message: 'Subscription {{planName}} của bạn đang ở trạng thái quá hạn do thanh toán thất bại.',
      warning: 'Vui lòng cập nhật phương thức thanh toán để tiếp tục sử dụng dịch vụ.',
      cta: 'Cập nhật ngay',
    },
    final: {
      subject: '🚨 Cảnh báo cuối: Subscription sẽ bị đình chỉ',
      title: 'Cảnh báo cuối cùng',
      message: 'Đây là cảnh báo cuối cùng. Subscription của bạn sẽ bị đình chỉ sau {{days}} ngày nếu không thanh toán.',
      urgent: 'Hành động ngay để tránh mất dịch vụ.',
      cta: 'Thanh toán ngay',
    },
    cancel_notice: {
      subject: '❌ Subscription đã bị hủy',
      title: 'Subscription đã hủy',
      message: 'Subscription {{planName}} của bạn đã bị hủy do thanh toán thất bại sau nhiều lần thử lại.',
      support: 'Nếu đây là nhầm lẫn, vui lòng liên hệ hỗ trợ.',
      cta: 'Liên hệ hỗ trợ',
    },
  },
}
