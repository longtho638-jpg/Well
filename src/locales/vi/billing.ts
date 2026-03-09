// Billing & Subscription translations
export const billing = {
  status: "status",
  // General
  title: 'Thanh toán & Subscription',
  description: 'Quản lý subscription, phương thức thanh toán và usage',
  loading: 'Đang tải...',
  error: 'Lỗi',
  no_organization: 'Không tìm thấy organization',
  no_subscription: 'Không tìm thấy subscription',
  load_error: 'Không thể tải thông tin thanh toán',
  update_error: 'Không thể cập nhật phương thức thanh toán',

  // Status
  status: {
    active: 'Hoạt động',
    past_due: 'Quá hạn',
    incomplete: 'Chưa hoàn tất',
    trialing: 'Dùng thử',
    canceled: 'Đã hủy',
    suspended: 'Đã đình chỉ',
  },

  // Payment Update Page
  update_payment_title: 'Cập nhật Phương thức Thanh toán',
  update_payment_description: 'Cập nhật phương thức thanh toán để tiếp tục sử dụng dịch vụ',
  payment_overdue_title: 'Thanh toán quá hạn',
  overdue_description: 'Thanh toán subscription của bạn đã thất bại. Vui lòng cập nhật phương thức thanh toán để tránh bị đình chỉ.',
  amount_due_label: 'Số tiền cần thanh toán',
  update_payment_method_btn: 'Cập nhật phương thức thanh toán',
  current_payment_method: 'Phương thức thanh toán hiện tại',
  change: 'Đổi',
  expires: 'Hết hạn',
  billing_info: 'Thông tin thanh toán',
  next_billing_date: 'Ngày thanh toán tiếp theo',
  status_label: 'Trạng thái',
  portal_opened: 'Stripe Customer Portal đã được mở trong tab mới',
  secure_payment: 'Thanh toán an toàn qua Stripe',
  stripe_secure: 'Thông tin thanh toán của bạn được xử lý an toàn qua Stripe Customer Portal.',
  stripe_privacy: 'Chính sách bảo mật Stripe',

  // Legacy aliases (for backward compatibility)
  amount_due: 'Số tiền cần thanh toán',
  update_payment_method: 'Cập nhật phương thức thanh toán',
  payment_overdue: 'Thanh toán quá hạn',
  usage_this_period: 'Usage kỳ này',
  renews_on: 'Gia hạn vào',
  update_payment: 'Cập nhật thanh toán',
  overage_warning: 'Bạn đã vượt quá giới hạn - sẽ bị tính phí bổ sung',
  over_limit: 'Vượt giới hạn',
  used: 'Đã dùng',
  limit: 'Giới hạn',
  overage_charge: 'Phí vượt mức',
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

  // SMS templates (short, concise messages)
  sms: {
    dunning_initial: '⚠️ WellNexus: Thanh toan that bai so tien {{amount}} cho goi {{plan_name}}. Cap nhat phuong thuc thanh toan: {{payment_url}}',
    dunning_reminder: '🔔 WellNexus: Nhac nho: Thanh toan qua han {{amount}}. Dich vu se bi tam ngưng sau {{days}} ngay neu khong thanh toan. Cap nhat ngay: {{payment_url}}',
    dunning_final: '🚨 WellNexus: Canh bao cuoi! Subscription cua ban se bi dinh chi trong {{days}} ngay. Thanh toan ngay: {{payment_url}}',
    dunning_cancel: '❌ WellNexus: Subscription da bi huy do thanh toan that bai. Lien he support@wellnexus.vn de duoc ho tro.',
    payment_confirmation: '✅ WellNexus: Da nhan thanh toan {{amount}}. Subscription cua ban da duoc kich hoat lai. Cam on ban!',
  },
}
